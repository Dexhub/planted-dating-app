"""
Real-time Inference System for Planted ML Recommendation Engine
Provides <100ms response time for match generation with intelligent caching
"""

import os
import sys
import time
import json
import asyncio
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import numpy as np
import pandas as pd
import redis
import torch
import joblib
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.hybrid_recommender import HybridRecommender, PlantedFeatureEncoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class InferenceConfig:
    """Configuration for inference system"""
    model_path: str = "models/trained/planted_recommender_latest.joblib"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    cache_ttl: int = 3600  # 1 hour
    batch_size: int = 32
    max_candidates: int = 1000
    response_timeout_ms: int = 100
    precompute_batch_size: int = 100
    
    # Database configuration
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "planted_db"
    db_user: str = "planted_user"
    db_password: str = "planted_password"

class UserProfile(BaseModel):
    """User profile data model"""
    user_id: str
    motivation_score: float
    strictness_level: float
    journey_stage: float
    social_comfort: float
    animal_rights_score: float
    environmental_score: float
    health_motivation: float
    spiritual_connection: float
    activism_level: float
    cooking_skill_level: float
    sustainability_practices: float
    community_involvement: float
    swipe_selectivity: float = 0.5
    message_quality_score: float = 0.5
    response_time_pattern: float = 0.5
    engagement_depth: float = 0.5
    profile_completion: float = 0.5
    activity_frequency: float = 0.5

class MatchRequest(BaseModel):
    """Match request data model"""
    user_id: str
    candidate_ids: Optional[List[str]] = None
    top_k: int = 10
    include_scores: bool = False
    filter_criteria: Optional[Dict[str, Any]] = None

class MatchResponse(BaseModel):
    """Match response data model"""
    user_id: str
    matches: List[Dict[str, Any]]
    processing_time_ms: float
    cached: bool
    total_candidates: int

class CacheManager:
    """Redis-based caching for model predictions and user data"""
    
    def __init__(self, config: InferenceConfig):
        self.config = config
        self.redis_client = redis.Redis(
            host=config.redis_host,
            port=config.redis_port,
            db=config.redis_db,
            decode_responses=True
        )
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user profile"""
        try:
            profile_data = self.redis_client.get(f"user_profile:{user_id}")
            if profile_data:
                return json.loads(profile_data)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set_user_profile(self, user_id: str, profile: Dict[str, Any]):
        """Cache user profile"""
        try:
            self.redis_client.setex(
                f"user_profile:{user_id}",
                self.config.cache_ttl,
                json.dumps(profile)
            )
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    def get_precomputed_matches(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get precomputed matches for user"""
        try:
            matches_data = self.redis_client.get(f"matches:{user_id}")
            if matches_data:
                return json.loads(matches_data)
            return None
        except Exception as e:
            logger.error(f"Cache get matches error: {e}")
            return None
    
    def set_precomputed_matches(self, user_id: str, matches: List[Dict[str, Any]]):
        """Cache precomputed matches"""
        try:
            self.redis_client.setex(
                f"matches:{user_id}",
                self.config.cache_ttl * 6,  # 6 hours for matches
                json.dumps(matches)
            )
        except Exception as e:
            logger.error(f"Cache set matches error: {e}")
    
    def get_compatibility_score(self, user1_id: str, user2_id: str) -> Optional[float]:
        """Get cached compatibility score"""
        try:
            # Use sorted IDs to ensure consistent caching
            key = f"compat:{':'.join(sorted([user1_id, user2_id]))}"
            score = self.redis_client.get(key)
            return float(score) if score else None
        except Exception as e:
            logger.error(f"Cache get compatibility error: {e}")
            return None
    
    def set_compatibility_score(self, user1_id: str, user2_id: str, score: float):
        """Cache compatibility score"""
        try:
            key = f"compat:{':'.join(sorted([user1_id, user2_id]))}"
            self.redis_client.setex(key, self.config.cache_ttl * 2, str(score))
        except Exception as e:
            logger.error(f"Cache set compatibility error: {e}")

class DatabaseManager:
    """Database operations for user data and interactions"""
    
    def __init__(self, config: InferenceConfig):
        self.config = config
        self.connection_pool = None
        self._create_connection_pool()
    
    def _create_connection_pool(self):
        """Create database connection pool"""
        try:
            import psycopg2.pool
            self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                host=self.config.db_host,
                port=self.config.db_port,
                database=self.config.db_name,
                user=self.config.db_user,
                password=self.config.db_password
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            self.connection_pool = None
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from database"""
        if not self.connection_pool:
            return None
        
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
            SELECT user_id, motivation_score, strictness_level, journey_stage,
                   social_comfort, animal_rights_score, environmental_score,
                   health_motivation, spiritual_connection, activism_level,
                   cooking_skill_level, sustainability_practices, community_involvement,
                   swipe_selectivity, message_quality_score, response_time_pattern,
                   engagement_depth, profile_completion, activity_frequency
            FROM user_profiles WHERE user_id = %s
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result:
                return dict(result)
            return None
            
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return None
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def get_active_users(self, limit: int = 1000) -> List[str]:
        """Get list of active user IDs"""
        if not self.connection_pool:
            return []
        
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            
            query = """
            SELECT user_id FROM user_profiles 
            WHERE last_active > NOW() - INTERVAL '7 days'
            ORDER BY last_active DESC
            LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            
            return [row[0] for row in results]
            
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return []
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def record_interaction(self, user_id: str, target_user_id: str, 
                          interaction_type: str, score: float):
        """Record user interaction for learning"""
        if not self.connection_pool:
            return
        
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            
            query = """
            INSERT INTO user_interactions 
            (user_id, target_user_id, interaction_type, compatibility_score, timestamp)
            VALUES (%s, %s, %s, %s, NOW())
            """
            
            cursor.execute(query, (user_id, target_user_id, interaction_type, score))
            conn.commit()
            
        except Exception as e:
            logger.error(f"Database insert error: {e}")
        finally:
            if conn:
                self.connection_pool.putconn(conn)

class ModelInferenceEngine:
    """Core inference engine with performance optimization"""
    
    def __init__(self, config: InferenceConfig):
        self.config = config
        self.model: Optional[HybridRecommender] = None
        self.feature_encoder = PlantedFeatureEncoder()
        self.cache_manager = CacheManager(config)
        self.db_manager = DatabaseManager(config)
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Performance metrics
        self.request_count = 0
        self.total_processing_time = 0.0
        self.cache_hits = 0
        
        self._load_model()
    
    def _load_model(self):
        """Load the trained model"""
        try:
            if os.path.exists(self.config.model_path):
                self.model = HybridRecommender()
                self.model.load_model(self.config.model_path)
                logger.info(f"Model loaded from {self.config.model_path}")
            else:
                logger.warning(f"Model file not found: {self.config.model_path}")
                # Initialize with default model for demo
                self.model = HybridRecommender()
        except Exception as e:
            logger.error(f"Model loading error: {e}")
            self.model = HybridRecommender()
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile with caching"""
        # Try cache first
        profile = self.cache_manager.get_user_profile(user_id)
        if profile:
            self.cache_hits += 1
            return profile
        
        # Fallback to database
        profile = await asyncio.get_event_loop().run_in_executor(
            self.executor, self.db_manager.get_user_profile, user_id
        )
        
        if profile:
            # Cache the result
            self.cache_manager.set_user_profile(user_id, profile)
        
        return profile
    
    async def predict_compatibility(self, user1_id: str, user2_id: str) -> float:
        """Predict compatibility between two users"""
        # Check cache first
        cached_score = self.cache_manager.get_compatibility_score(user1_id, user2_id)
        if cached_score is not None:
            self.cache_hits += 1
            return cached_score
        
        # Get user profiles
        user1_profile = await self.get_user_profile(user1_id)
        user2_profile = await self.get_user_profile(user2_id)
        
        if not user1_profile or not user2_profile:
            return 0.5  # Default neutral score
        
        try:
            # Remove user_id from profiles for prediction
            user1_data = {k: v for k, v in user1_profile.items() if k != 'user_id'}
            user2_data = {k: v for k, v in user2_profile.items() if k != 'user_id'}
            
            # Predict compatibility
            score = self.model.predict_compatibility(user1_data, user2_data)
            
            # Cache the result
            self.cache_manager.set_compatibility_score(user1_id, user2_id, score)
            
            return score
            
        except Exception as e:
            logger.error(f"Compatibility prediction error: {e}")
            return 0.5
    
    async def get_recommendations(self, user_id: str, candidate_ids: Optional[List[str]] = None, 
                                top_k: int = 10) -> List[Dict[str, Any]]:
        """Get recommendations for a user"""
        start_time = time.time()
        
        # Check for precomputed matches
        cached_matches = self.cache_manager.get_precomputed_matches(user_id)
        if cached_matches and not candidate_ids:
            self.cache_hits += 1
            return cached_matches[:top_k]  # Return top-k from cache
        
        # Get user profile
        user_profile = await self.get_user_profile(user_id)
        if not user_profile:
            return []
        
        # Get candidates
        if not candidate_ids:
            candidate_ids = await asyncio.get_event_loop().run_in_executor(
                self.executor, self.db_manager.get_active_users, self.config.max_candidates
            )
            # Remove self from candidates
            candidate_ids = [cid for cid in candidate_ids if cid != user_id]
        
        # Batch compatibility prediction
        compatibility_tasks = [
            self.predict_compatibility(user_id, candidate_id) 
            for candidate_id in candidate_ids
        ]
        
        compatibility_scores = await asyncio.gather(*compatibility_tasks)
        
        # Create recommendations with scores
        recommendations = []
        for candidate_id, score in zip(candidate_ids, compatibility_scores):
            recommendations.append({
                'user_id': candidate_id,
                'compatibility_score': score,
                'timestamp': datetime.now().isoformat()
            })
        
        # Sort by score and return top-k
        recommendations.sort(key=lambda x: x['compatibility_score'], reverse=True)
        top_recommendations = recommendations[:top_k]
        
        # Cache results for future requests
        if not candidate_ids:  # Only cache if we generated our own candidate list
            self.cache_manager.set_precomputed_matches(user_id, recommendations[:50])  # Cache top 50
        
        processing_time = (time.time() - start_time) * 1000
        self.request_count += 1
        self.total_processing_time += processing_time
        
        return top_recommendations
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        avg_processing_time = (
            self.total_processing_time / self.request_count 
            if self.request_count > 0 else 0
        )
        
        cache_hit_rate = (
            self.cache_hits / (self.request_count * 2)  # Approximate
            if self.request_count > 0 else 0
        )
        
        return {
            'total_requests': self.request_count,
            'avg_processing_time_ms': avg_processing_time,
            'cache_hit_rate': cache_hit_rate,
            'cache_hits': self.cache_hits
        }

# FastAPI Application
app = FastAPI(title="Planted ML Inference API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global inference engine
inference_engine: Optional[ModelInferenceEngine] = None

@app.on_event("startup")
async def startup_event():
    """Initialize inference engine on startup"""
    global inference_engine
    config = InferenceConfig()
    inference_engine = ModelInferenceEngine(config)
    logger.info("Inference engine initialized")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": inference_engine.model is not None
    }

@app.post("/predict/compatibility", response_model=Dict[str, float])
async def predict_compatibility(user1_id: str, user2_id: str):
    """Predict compatibility between two users"""
    if not inference_engine:
        raise HTTPException(status_code=500, detail="Inference engine not initialized")
    
    try:
        score = await inference_engine.predict_compatibility(user1_id, user2_id)
        return {"compatibility_score": score}
    except Exception as e:
        logger.error(f"Compatibility prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/recommend", response_model=MatchResponse)
async def get_recommendations(request: MatchRequest):
    """Get recommendations for a user"""
    if not inference_engine:
        raise HTTPException(status_code=500, detail="Inference engine not initialized")
    
    start_time = time.time()
    
    try:
        recommendations = await inference_engine.get_recommendations(
            request.user_id,
            request.candidate_ids,
            request.top_k
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return MatchResponse(
            user_id=request.user_id,
            matches=recommendations,
            processing_time_ms=processing_time,
            cached=False,  # Would need to track this properly
            total_candidates=len(request.candidate_ids) if request.candidate_ids else 1000
        )
        
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Recommendation failed")

@app.get("/metrics")
async def get_metrics():
    """Get performance metrics"""
    if not inference_engine:
        raise HTTPException(status_code=500, detail="Inference engine not initialized")
    
    return inference_engine.get_performance_metrics()

@app.post("/precompute/{user_id}")
async def precompute_matches(user_id: str, background_tasks: BackgroundTasks):
    """Precompute matches for a user"""
    if not inference_engine:
        raise HTTPException(status_code=500, detail="Inference engine not initialized")
    
    background_tasks.add_task(_precompute_user_matches, user_id)
    return {"message": "Precomputation started", "user_id": user_id}

async def _precompute_user_matches(user_id: str):
    """Background task to precompute matches"""
    try:
        recommendations = await inference_engine.get_recommendations(user_id, top_k=50)
        logger.info(f"Precomputed {len(recommendations)} matches for user {user_id}")
    except Exception as e:
        logger.error(f"Precomputation error for user {user_id}: {e}")

@app.post("/batch_precompute")
async def batch_precompute(background_tasks: BackgroundTasks, limit: int = 100):
    """Batch precompute matches for active users"""
    if not inference_engine:
        raise HTTPException(status_code=500, detail="Inference engine not initialized")
    
    background_tasks.add_task(_batch_precompute_matches, limit)
    return {"message": "Batch precomputation started", "limit": limit}

async def _batch_precompute_matches(limit: int):
    """Background task for batch precomputation"""
    try:
        active_users = await asyncio.get_event_loop().run_in_executor(
            inference_engine.executor, 
            inference_engine.db_manager.get_active_users, 
            limit
        )
        
        for user_id in active_users:
            try:
                await _precompute_user_matches(user_id)
                await asyncio.sleep(0.1)  # Small delay to prevent overload
            except Exception as e:
                logger.error(f"Batch precomputation error for user {user_id}: {e}")
        
        logger.info(f"Batch precomputation completed for {len(active_users)} users")
    except Exception as e:
        logger.error(f"Batch precomputation error: {e}")

# CLI for running the inference server
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Planted ML Inference Server")
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host address')
    parser.add_argument('--port', type=int, default=8000, help='Port number')
    parser.add_argument('--workers', type=int, default=4, help='Number of workers')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    
    args = parser.parse_args()
    
    uvicorn.run(
        "realtime_inference:app",
        host=args.host,
        port=args.port,
        workers=args.workers,
        reload=args.reload,
        log_level="info"
    )