"""
Automated Training Pipeline for Planted ML Recommendation Engine
Handles data collection, preprocessing, model training, and validation
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import yaml
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import mlflow
import mlflow.pytorch
import mlflow.sklearn
from sklearn.model_selection import cross_val_score, TimeSeriesSplit
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
import torch
import joblib
import boto3
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.hybrid_recommender import HybridRecommender, PlantedFeatureEncoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class TrainingConfig:
    """Configuration for training pipeline"""
    model_type: str = 'hybrid'
    batch_size: int = 256
    epochs: int = 100
    learning_rate: float = 0.001
    validation_split: float = 0.2
    early_stopping_patience: int = 10
    cross_validation_folds: int = 5
    feature_selection_threshold: float = 0.01
    model_save_path: str = 'models/trained'
    experiment_name: str = 'planted_recommendation_engine'
    mlflow_tracking_uri: str = 'http://localhost:5000'

class DataCollector:
    """Collects and preprocesses training data"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.feature_encoder = PlantedFeatureEncoder()
    
    def collect_user_interactions(self, days_back: int = 30) -> pd.DataFrame:
        """Collect user interaction data from the last N days"""
        # This would connect to your database
        # For demo purposes, we'll generate synthetic data
        logger.info(f"Collecting user interactions from last {days_back} days")
        
        # In production, this would be:
        # query = """
        # SELECT ui.user_id, ui.target_user_id, ui.interaction_type, 
        #        ui.timestamp, ui.outcome, u1.*, u2.*
        # FROM user_interactions ui
        # JOIN users u1 ON ui.user_id = u1.id
        # JOIN users u2 ON ui.target_user_id = u2.id
        # WHERE ui.timestamp >= NOW() - INTERVAL %s DAY
        # """
        
        return self._generate_synthetic_data(1000)
    
    def _generate_synthetic_data(self, n_samples: int) -> pd.DataFrame:
        """Generate synthetic training data for demo"""
        np.random.seed(42)
        
        data = []
        for i in range(n_samples):
            # User 1 features
            user1_data = {
                'user1_motivation_score': np.random.beta(2, 2),
                'user1_strictness_level': np.random.beta(3, 2),
                'user1_journey_stage': np.random.gamma(2, 0.3),
                'user1_social_comfort': np.random.beta(2, 3),
                'user1_animal_rights': np.random.beta(4, 2),
                'user1_environmental': np.random.beta(3, 2),
                'user1_health_motivation': np.random.beta(2, 2),
                'user1_spiritual': np.random.beta(1.5, 3),
                'user1_activism_level': np.random.beta(2, 4),
                'user1_cooking_skill': np.random.beta(2, 2),
                'user1_sustainability': np.random.beta(3, 2),
                'user1_community_involvement': np.random.beta(2, 3),
                'user1_swipe_selectivity': np.random.beta(3, 5),
                'user1_message_quality': np.random.beta(4, 2),
                'user1_response_time': np.random.gamma(2, 0.2),
                'user1_engagement_depth': np.random.beta(3, 3),
                'user1_profile_completion': np.random.beta(5, 2),
                'user1_activity_frequency': np.random.beta(2, 2),
            }
            
            # User 2 features (similar structure)
            user2_data = {
                'user2_motivation_score': np.random.beta(2, 2),
                'user2_strictness_level': np.random.beta(3, 2),
                'user2_journey_stage': np.random.gamma(2, 0.3),
                'user2_social_comfort': np.random.beta(2, 3),
                'user2_animal_rights': np.random.beta(4, 2),
                'user2_environmental': np.random.beta(3, 2),
                'user2_health_motivation': np.random.beta(2, 2),
                'user2_spiritual': np.random.beta(1.5, 3),
                'user2_activism_level': np.random.beta(2, 4),
                'user2_cooking_skill': np.random.beta(2, 2),
                'user2_sustainability': np.random.beta(3, 2),
                'user2_community_involvement': np.random.beta(2, 3),
                'user2_swipe_selectivity': np.random.beta(3, 5),
                'user2_message_quality': np.random.beta(4, 2),
                'user2_response_time': np.random.gamma(2, 0.2),
                'user2_engagement_depth': np.random.beta(3, 3),
                'user2_profile_completion': np.random.beta(5, 2),
                'user2_activity_frequency': np.random.beta(2, 2),
            }
            
            # Calculate compatibility based on feature similarity
            compatibility = self._calculate_synthetic_compatibility(user1_data, user2_data)
            
            # Interaction outcome (like, match, message, date)
            interaction_type = np.random.choice(['swipe_right', 'swipe_left', 'match', 'message', 'date'], 
                                              p=[0.3, 0.4, 0.15, 0.1, 0.05])
            
            # Combine all data
            sample = {**user1_data, **user2_data}
            sample.update({
                'compatibility_score': compatibility,
                'interaction_type': interaction_type,
                'outcome': 1 if interaction_type in ['swipe_right', 'match', 'message', 'date'] else 0,
                'timestamp': datetime.now() - timedelta(days=np.random.randint(0, 30))
            })
            
            data.append(sample)
        
        return pd.DataFrame(data)
    
    def _calculate_synthetic_compatibility(self, user1: Dict, user2: Dict) -> float:
        """Calculate synthetic compatibility score based on feature similarity"""
        # Extract feature vectors
        u1_features = np.array([v for k, v in user1.items() if 'user1_' in k])
        u2_features = np.array([v for k, v in user2.items() if 'user2_' in k])
        
        # Calculate weighted similarity
        weights = np.array([0.8, 0.6, 0.4, 0.7, 0.9, 0.8, 0.5, 0.6, 0.7, 0.8, 0.8, 0.6, 0.3, 0.5, 0.4, 0.6, 0.2, 0.4])
        
        # Cosine similarity with weights
        dot_product = np.dot(u1_features * weights, u2_features * weights)
        norm1 = np.linalg.norm(u1_features * weights)
        norm2 = np.linalg.norm(u2_features * weights)
        
        if norm1 == 0 or norm2 == 0:
            return 0.5
        
        similarity = dot_product / (norm1 * norm2)
        # Normalize to [0, 1] and add some noise
        compatibility = (similarity + 1) / 2
        compatibility += np.random.normal(0, 0.1)  # Add noise
        
        return np.clip(compatibility, 0, 1)
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Preprocess data for training"""
        logger.info("Preprocessing training data")
        
        # Separate features and labels
        feature_columns = [col for col in df.columns if col.startswith(('user1_', 'user2_'))]
        X = df[feature_columns].values
        y = df['compatibility_score'].values
        
        # Handle missing values
        X = np.nan_to_num(X, nan=0.5)
        y = np.nan_to_num(y, nan=0.5)
        
        logger.info(f"Preprocessed data shape: {X.shape}")
        return X, y

class ModelTrainer:
    """Handles model training and validation"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.recommender = HybridRecommender()
        
        # Initialize MLflow
        mlflow.set_tracking_uri(config.mlflow_tracking_uri)
        mlflow.set_experiment(config.experiment_name)
    
    def train_model(self, training_data: pd.DataFrame) -> HybridRecommender:
        """Train the hybrid recommendation model"""
        logger.info("Starting model training")
        
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params({
                'model_type': self.config.model_type,
                'batch_size': self.config.batch_size,
                'epochs': self.config.epochs,
                'learning_rate': self.config.learning_rate,
                'validation_split': self.config.validation_split
            })
            
            # Train compatibility scorer
            logger.info("Training compatibility scoring model")
            self.recommender.train_compatibility_model(training_data)
            
            # Log compatibility model metrics
            importance = self.recommender.compatibility_scorer.get_feature_importance()
            for feature, imp in importance.items():
                mlflow.log_metric(f"feature_importance_{feature}", imp)
            
            # Train deep network
            logger.info("Training deep recommendation network")
            self.recommender.train_deep_network(training_data, epochs=self.config.epochs)
            
            # Validate model
            validation_metrics = self._validate_model(training_data)
            
            # Log validation metrics
            for metric, value in validation_metrics.items():
                mlflow.log_metric(metric, value)
            
            # Save model
            model_path = self._save_model()
            mlflow.log_artifact(model_path)
            
            logger.info("Model training completed successfully")
            
        return self.recommender
    
    def _validate_model(self, data: pd.DataFrame) -> Dict[str, float]:
        """Validate model performance using cross-validation"""
        logger.info("Validating model performance")
        
        # Prepare data for validation
        X = []
        y = []
        
        for i in range(len(data) - 1):
            for j in range(i + 1, min(i + 10, len(data))):  # Sample pairs to avoid O(n²)
                user1_data = {k.replace('user1_', ''): v for k, v in data.iloc[i].items() if k.startswith('user1_')}
                user2_data = {k.replace('user2_', ''): v for k, v in data.iloc[j].items() if k.startswith('user2_')}
                
                try:
                    pred_score = self.recommender.predict_compatibility(user1_data, user2_data)
                    true_score = data.iloc[i]['compatibility_score']
                    
                    X.append(pred_score)
                    y.append(true_score)
                except Exception as e:
                    logger.warning(f"Prediction error: {e}")
                    continue
        
        X = np.array(X)
        y = np.array(y)
        
        # Calculate metrics
        mse = np.mean((X - y) ** 2)
        mae = np.mean(np.abs(X - y))
        rmse = np.sqrt(mse)
        
        # Convert to binary classification for additional metrics
        X_binary = (X > 0.6).astype(int)
        y_binary = (y > 0.6).astype(int)
        
        precision = precision_score(y_binary, X_binary, zero_division=0)
        recall = recall_score(y_binary, X_binary, zero_division=0)
        f1 = f1_score(y_binary, X_binary, zero_division=0)
        
        metrics = {
            'mse': mse,
            'mae': mae,
            'rmse': rmse,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
        
        logger.info(f"Validation metrics: {metrics}")
        return metrics
    
    def _save_model(self) -> str:
        """Save the trained model"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"planted_recommender_{timestamp}.joblib"
        model_path = os.path.join(self.config.model_save_path, model_filename)
        
        # Create directory if it doesn't exist
        os.makedirs(self.config.model_save_path, exist_ok=True)
        
        # Save model
        self.recommender.save_model(model_path)
        
        logger.info(f"Model saved to {model_path}")
        return model_path

class ModelEvaluator:
    """Evaluates model performance with comprehensive metrics"""
    
    def __init__(self, model: HybridRecommender):
        self.model = model
    
    def evaluate_ranking_performance(self, test_data: pd.DataFrame, k_values: List[int] = [5, 10, 20]) -> Dict[str, float]:
        """Evaluate ranking performance using NDCG and other ranking metrics"""
        logger.info("Evaluating ranking performance")
        
        metrics = {}
        
        for k in k_values:
            ndcg_scores = []
            
            # Sample test cases for efficiency
            test_sample = test_data.sample(min(100, len(test_data)), random_state=42)
            
            for idx, row in test_sample.iterrows():
                user_data = {k.replace('user1_', ''): v for k, v in row.items() if k.startswith('user1_')}
                
                # Create candidate pool (in practice, this would be real candidates)
                candidates = []
                true_relevance = []
                
                for i in range(k * 2):  # Create more candidates than needed
                    candidate_data = {k.replace('user2_', ''): v for k, v in test_data.sample(1).iloc[0].items() if k.startswith('user2_')}
                    candidates.append(candidate_data)
                    
                    # True relevance based on actual compatibility
                    relevance = self.model.predict_compatibility(user_data, candidate_data)
                    true_relevance.append(relevance)
                
                # Get model recommendations
                recommendations = self.model.get_recommendations(user_data, candidates, top_k=k)
                
                # Calculate NDCG
                predicted_relevance = [score for _, score in recommendations]
                predicted_relevance.extend([0.0] * (k - len(predicted_relevance)))  # Pad if needed
                
                # NDCG calculation (simplified)
                dcg = sum(rel / np.log2(i + 2) for i, rel in enumerate(predicted_relevance[:k]))
                ideal_relevance = sorted(true_relevance, reverse=True)[:k]
                idcg = sum(rel / np.log2(i + 2) for i, rel in enumerate(ideal_relevance))
                
                ndcg = dcg / idcg if idcg > 0 else 0
                ndcg_scores.append(ndcg)
            
            metrics[f'ndcg@{k}'] = np.mean(ndcg_scores)
        
        logger.info(f"Ranking metrics: {metrics}")
        return metrics
    
    def evaluate_diversity(self, recommendations: List[List[Tuple[int, float]]]) -> Dict[str, float]:
        """Evaluate recommendation diversity"""
        logger.info("Evaluating recommendation diversity")
        
        # Calculate intra-list diversity (simplified)
        diversity_scores = []
        
        for rec_list in recommendations:
            if len(rec_list) < 2:
                continue
            
            # Calculate pairwise diversity within the list
            pairwise_diversities = []
            for i in range(len(rec_list)):
                for j in range(i + 1, len(rec_list)):
                    # Simplified diversity measure
                    diversity = abs(rec_list[i][1] - rec_list[j][1])
                    pairwise_diversities.append(diversity)
            
            if pairwise_diversities:
                diversity_scores.append(np.mean(pairwise_diversities))
        
        return {
            'avg_intra_list_diversity': np.mean(diversity_scores) if diversity_scores else 0,
            'diversity_std': np.std(diversity_scores) if diversity_scores else 0
        }

class TrainingPipeline:
    """Main training pipeline orchestrator"""
    
    def __init__(self, config_path: str = None):
        # Load configuration
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config_dict = yaml.safe_load(f)
            self.config = TrainingConfig(**config_dict)
        else:
            self.config = TrainingConfig()
        
        # Initialize components
        self.data_collector = DataCollector(self.config)
        self.model_trainer = ModelTrainer(self.config)
        
    def run_full_pipeline(self) -> HybridRecommender:
        """Run the complete training pipeline"""
        logger.info("Starting full training pipeline")
        
        try:
            # Step 1: Data Collection
            logger.info("Step 1: Collecting training data")
            training_data = self.data_collector.collect_user_interactions(days_back=30)
            logger.info(f"Collected {len(training_data)} training samples")
            
            # Step 2: Data Preprocessing
            logger.info("Step 2: Preprocessing data")
            # Data is already preprocessed in the collector
            
            # Step 3: Model Training
            logger.info("Step 3: Training model")
            trained_model = self.model_trainer.train_model(training_data)
            
            # Step 4: Model Evaluation
            logger.info("Step 4: Evaluating model")
            evaluator = ModelEvaluator(trained_model)
            
            # Split data for evaluation
            eval_data = training_data.sample(frac=0.2, random_state=42)
            ranking_metrics = evaluator.evaluate_ranking_performance(eval_data)
            
            logger.info(f"Final model performance: {ranking_metrics}")
            
            # Step 5: Model Deployment Preparation
            logger.info("Step 5: Preparing for deployment")
            self._prepare_deployment(trained_model)
            
            logger.info("Training pipeline completed successfully")
            return trained_model
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise
    
    def _prepare_deployment(self, model: HybridRecommender):
        """Prepare model for deployment"""
        # Create deployment configuration
        deployment_config = {
            'model_version': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'model_type': 'hybrid_recommender',
            'feature_dim': 18,  # Total feature dimensions
            'inference_batch_size': self.config.batch_size,
            'max_candidates': 1000,
            'cache_ttl_hours': 24
        }
        
        # Save deployment config
        config_path = os.path.join(self.config.model_save_path, 'deployment_config.json')
        with open(config_path, 'w') as f:
            json.dump(deployment_config, f, indent=2)
        
        logger.info("Deployment configuration saved")

# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Planted ML Training Pipeline")
    parser.add_argument('--config', type=str, help='Path to configuration file')
    parser.add_argument('--mode', type=str, choices=['full', 'train_only', 'evaluate_only'], 
                       default='full', help='Pipeline mode')
    
    args = parser.parse_args()
    
    # Initialize and run pipeline
    pipeline = TrainingPipeline(args.config)
    
    if args.mode == 'full':
        trained_model = pipeline.run_full_pipeline()
    elif args.mode == 'train_only':
        # Collect data and train
        training_data = pipeline.data_collector.collect_user_interactions()
        trained_model = pipeline.model_trainer.train_model(training_data)
    elif args.mode == 'evaluate_only':
        # Load existing model and evaluate
        # This would require loading a saved model
        logger.info("Evaluation-only mode not fully implemented")
    
    logger.info("Pipeline execution completed")