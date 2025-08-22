"""
Hybrid Recommendation Engine for Planted Dating App
Combines collaborative filtering, content-based filtering, and deep learning
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, ndcg_score
import xgboost as xgb
from typing import Dict, List, Tuple, Optional
import logging
import joblib
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlantedFeatureEncoder:
    """Feature encoder for plant-based dating compatibility"""
    
    def __init__(self):
        self.dietary_journey_weights = {
            'motivation_score': 0.3,
            'strictness_level': 0.2,
            'journey_stage': 0.3,
            'social_comfort': 0.2
        }
        
        self.values_alignment_weights = {
            'animal_rights': 0.25,
            'environmental': 0.25,
            'health_motivation': 0.2,
            'spiritual_connection': 0.15,
            'activism_level': 0.15
        }
        
        self.lifestyle_weights = {
            'cooking_skill': 0.4,
            'sustainability_practices': 0.35,
            'community_involvement': 0.25
        }
    
    def encode_dietary_journey(self, user_data: Dict) -> np.ndarray:
        """Encode dietary journey vector"""
        features = [
            user_data.get('motivation_score', 0.5),
            user_data.get('strictness_level', 0.5),
            user_data.get('journey_stage', 0.5),
            user_data.get('social_comfort', 0.5)
        ]
        return np.array(features, dtype=np.float32)
    
    def encode_values_alignment(self, user_data: Dict) -> np.ndarray:
        """Encode values alignment vector"""
        features = [
            user_data.get('animal_rights_score', 0.5),
            user_data.get('environmental_score', 0.5),
            user_data.get('health_motivation', 0.5),
            user_data.get('spiritual_connection', 0.5),
            user_data.get('activism_level', 0.5)
        ]
        return np.array(features, dtype=np.float32)
    
    def encode_lifestyle_compatibility(self, user_data: Dict) -> np.ndarray:
        """Encode lifestyle compatibility vector"""
        features = [
            user_data.get('cooking_skill_level', 0.5),
            user_data.get('sustainability_practices', 0.5),
            user_data.get('community_involvement', 0.5)
        ]
        return np.array(features, dtype=np.float32)
    
    def encode_behavioral_features(self, user_data: Dict) -> np.ndarray:
        """Encode behavioral features"""
        features = [
            user_data.get('swipe_selectivity', 0.5),
            user_data.get('message_quality_score', 0.5),
            user_data.get('response_time_pattern', 0.5),
            user_data.get('engagement_depth', 0.5),
            user_data.get('profile_completion', 0.5),
            user_data.get('activity_frequency', 0.5)
        ]
        return np.array(features, dtype=np.float32)
    
    def encode_user_features(self, user_data: Dict) -> np.ndarray:
        """Encode complete user feature vector"""
        dietary = self.encode_dietary_journey(user_data)
        values = self.encode_values_alignment(user_data)
        lifestyle = self.encode_lifestyle_compatibility(user_data)
        behavioral = self.encode_behavioral_features(user_data)
        
        # Concatenate all feature vectors
        return np.concatenate([dietary, values, lifestyle, behavioral])

class DeepRecommenderNetwork(nn.Module):
    """Deep neural network for recommendation scoring"""
    
    def __init__(self, user_features_dim: int, item_features_dim: int, 
                 embedding_dim: int = 128, hidden_dims: List[int] = [256, 128, 64]):
        super(DeepRecommenderNetwork, self).__init__()
        
        self.user_embedding = nn.Linear(user_features_dim, embedding_dim)
        self.item_embedding = nn.Linear(item_features_dim, embedding_dim)
        
        # Multi-layer perceptron for interaction modeling
        mlp_input_dim = embedding_dim * 2
        layers = []
        
        for i, hidden_dim in enumerate(hidden_dims):
            layers.append(nn.Linear(mlp_input_dim if i == 0 else hidden_dims[i-1], hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.2))
            layers.append(nn.BatchNorm1d(hidden_dim))
        
        layers.append(nn.Linear(hidden_dims[-1], 1))
        layers.append(nn.Sigmoid())
        
        self.mlp = nn.Sequential(*layers)
    
    def forward(self, user_features: torch.Tensor, item_features: torch.Tensor) -> torch.Tensor:
        """Forward pass through the network"""
        user_emb = torch.relu(self.user_embedding(user_features))
        item_emb = torch.relu(self.item_embedding(item_features))
        
        # Concatenate embeddings
        combined = torch.cat([user_emb, item_emb], dim=1)
        
        # Pass through MLP
        output = self.mlp(combined)
        return output.squeeze()

class CompatibilityScorer:
    """Traditional ML model for interpretable compatibility scoring"""
    
    def __init__(self, model_type: str = 'xgboost'):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_importance_ = None
    
    def train(self, X: np.ndarray, y: np.ndarray, validation_split: float = 0.2):
        """Train the compatibility scoring model"""
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        if self.model_type == 'xgboost':
            self.model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
        elif self.model_type == 'random_forest':
            self.model = RandomForestRegressor(
                n_estimators=200,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        val_pred = self.model.predict(X_val_scaled)
        val_rmse = np.sqrt(mean_squared_error(y_val, val_pred))
        logger.info(f"Validation RMSE: {val_rmse:.4f}")
        
        # Store feature importance
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance_ = self.model.feature_importances_
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict compatibility scores"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        if self.feature_importance_ is None:
            return {}
        
        feature_names = [
            # Dietary journey features
            'motivation_score', 'strictness_level', 'journey_stage', 'social_comfort',
            # Values alignment features
            'animal_rights', 'environmental', 'health_motivation', 'spiritual', 'activism',
            # Lifestyle compatibility features
            'cooking_skill', 'sustainability', 'community_involvement',
            # Behavioral features
            'swipe_selectivity', 'message_quality', 'response_time', 
            'engagement_depth', 'profile_completion', 'activity_frequency'
        ]
        
        return dict(zip(feature_names, self.feature_importance_))

class HybridRecommender:
    """Main hybrid recommendation engine"""
    
    def __init__(self, embedding_dim: int = 128):
        self.feature_encoder = PlantedFeatureEncoder()
        self.compatibility_scorer = CompatibilityScorer('xgboost')
        self.deep_network = None
        self.embedding_dim = embedding_dim
        
        # Ensemble weights
        self.weights = {
            'compatibility': 0.4,
            'deep_network': 0.4,
            'collaborative': 0.2
        }
    
    def train_compatibility_model(self, training_data: pd.DataFrame):
        """Train the compatibility scoring model"""
        logger.info("Training compatibility scoring model...")
        
        # Encode features for all users
        user_features = []
        compatibility_scores = []
        
        for _, row in training_data.iterrows():
            user_data = row.to_dict()
            features = self.feature_encoder.encode_user_features(user_data)
            user_features.append(features)
            compatibility_scores.append(row['compatibility_score'])
        
        X = np.array(user_features)
        y = np.array(compatibility_scores)
        
        self.compatibility_scorer.train(X, y)
        logger.info("Compatibility model training completed")
    
    def train_deep_network(self, training_data: pd.DataFrame, epochs: int = 100):
        """Train the deep recommendation network"""
        logger.info("Training deep recommendation network...")
        
        # Prepare data
        user_features = []
        item_features = []
        labels = []
        
        for _, row in training_data.iterrows():
            user_data = row.to_dict()
            item_data = row.to_dict()  # In practice, this would be different users
            
            user_feat = self.feature_encoder.encode_user_features(user_data)
            item_feat = self.feature_encoder.encode_user_features(item_data)
            
            user_features.append(user_feat)
            item_features.append(item_feat)
            labels.append(row.get('match_score', row.get('compatibility_score', 0.5)))
        
        # Convert to tensors
        X_user = torch.FloatTensor(np.array(user_features))
        X_item = torch.FloatTensor(np.array(item_features))
        y = torch.FloatTensor(np.array(labels))
        
        # Initialize network
        feature_dim = X_user.shape[1]
        self.deep_network = DeepRecommenderNetwork(feature_dim, feature_dim, self.embedding_dim)
        
        # Training setup
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.deep_network.parameters(), lr=0.001)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.5)
        
        # Split data
        split_idx = int(0.8 * len(X_user))
        train_indices = list(range(split_idx))
        val_indices = list(range(split_idx, len(X_user)))
        
        # Training loop
        best_val_loss = float('inf')
        patience = 10
        patience_counter = 0
        
        for epoch in range(epochs):
            # Training phase
            self.deep_network.train()
            train_loss = 0.0
            
            for i in train_indices:
                optimizer.zero_grad()
                
                pred = self.deep_network(X_user[i:i+1], X_item[i:i+1])
                loss = criterion(pred, y[i:i+1])
                
                loss.backward()
                optimizer.step()
                train_loss += loss.item()
            
            # Validation phase
            self.deep_network.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for i in val_indices:
                    pred = self.deep_network(X_user[i:i+1], X_item[i:i+1])
                    loss = criterion(pred, y[i:i+1])
                    val_loss += loss.item()
            
            train_loss /= len(train_indices)
            val_loss /= len(val_indices)
            
            scheduler.step()
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}: Train Loss = {train_loss:.4f}, Val Loss = {val_loss:.4f}")
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    logger.info(f"Early stopping at epoch {epoch}")
                    break
        
        logger.info("Deep network training completed")
    
    def predict_compatibility(self, user1_data: Dict, user2_data: Dict) -> float:
        """Predict compatibility between two users"""
        # Encode features
        user1_features = self.feature_encoder.encode_user_features(user1_data)
        user2_features = self.feature_encoder.encode_user_features(user2_data)
        
        # Combine features for compatibility scoring
        combined_features = np.concatenate([user1_features, user2_features]).reshape(1, -1)
        
        # Get compatibility score
        compat_score = self.compatibility_scorer.predict(combined_features)[0]
        
        # Get deep network score if available
        deep_score = 0.5  # Default
        if self.deep_network is not None:
            self.deep_network.eval()
            with torch.no_grad():
                user1_tensor = torch.FloatTensor(user1_features).unsqueeze(0)
                user2_tensor = torch.FloatTensor(user2_features).unsqueeze(0)
                deep_score = self.deep_network(user1_tensor, user2_tensor).item()
        
        # Collaborative filtering score (simplified)
        collab_score = self._compute_collaborative_score(user1_data, user2_data)
        
        # Ensemble prediction
        final_score = (
            self.weights['compatibility'] * compat_score +
            self.weights['deep_network'] * deep_score +
            self.weights['collaborative'] * collab_score
        )
        
        return np.clip(final_score, 0, 1)
    
    def _compute_collaborative_score(self, user1_data: Dict, user2_data: Dict) -> float:
        """Simplified collaborative filtering score"""
        # In practice, this would look at similar users' preferences
        # For now, return a basic similarity score
        user1_features = self.feature_encoder.encode_user_features(user1_data)
        user2_features = self.feature_encoder.encode_user_features(user2_data)
        
        # Cosine similarity
        dot_product = np.dot(user1_features, user2_features)
        norm1 = np.linalg.norm(user1_features)
        norm2 = np.linalg.norm(user2_features)
        
        if norm1 == 0 or norm2 == 0:
            return 0.5
        
        similarity = dot_product / (norm1 * norm2)
        return (similarity + 1) / 2  # Normalize to [0, 1]
    
    def get_recommendations(self, user_data: Dict, candidate_users: List[Dict], 
                          top_k: int = 10) -> List[Tuple[int, float]]:
        """Get top-k recommendations for a user"""
        scores = []
        
        for i, candidate in enumerate(candidate_users):
            score = self.predict_compatibility(user_data, candidate)
            scores.append((i, score))
        
        # Sort by score and return top-k
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
    
    def save_model(self, filepath: str):
        """Save the trained model"""
        model_data = {
            'compatibility_scorer': self.compatibility_scorer,
            'deep_network_state': self.deep_network.state_dict() if self.deep_network else None,
            'weights': self.weights,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        
        self.compatibility_scorer = model_data['compatibility_scorer']
        self.weights = model_data['weights']
        
        if model_data['deep_network_state'] is not None:
            # Reconstruct deep network (you'd need to know the architecture)
            # This is simplified - in practice, save architecture info too
            pass
        
        logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Create sample data for testing
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = []
    for i in range(n_samples):
        user_data = {
            'motivation_score': np.random.random(),
            'strictness_level': np.random.random(),
            'journey_stage': np.random.random(),
            'social_comfort': np.random.random(),
            'animal_rights_score': np.random.random(),
            'environmental_score': np.random.random(),
            'health_motivation': np.random.random(),
            'spiritual_connection': np.random.random(),
            'activism_level': np.random.random(),
            'cooking_skill_level': np.random.random(),
            'sustainability_practices': np.random.random(),
            'community_involvement': np.random.random(),
            'swipe_selectivity': np.random.random(),
            'message_quality_score': np.random.random(),
            'response_time_pattern': np.random.random(),
            'engagement_depth': np.random.random(),
            'profile_completion': np.random.random(),
            'activity_frequency': np.random.random(),
            'compatibility_score': np.random.random()
        }
        sample_data.append(user_data)
    
    # Create DataFrame
    df = pd.DataFrame(sample_data)
    
    # Initialize and train model
    recommender = HybridRecommender()
    recommender.train_compatibility_model(df)
    recommender.train_deep_network(df, epochs=50)
    
    # Test prediction
    user1 = sample_data[0]
    user2 = sample_data[1]
    
    compatibility = recommender.predict_compatibility(user1, user2)
    print(f"Compatibility score: {compatibility:.4f}")
    
    # Get feature importance
    importance = recommender.compatibility_scorer.get_feature_importance()
    print("Feature importance:", importance)