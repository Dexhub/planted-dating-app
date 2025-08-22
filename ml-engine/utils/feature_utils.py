"""
Feature Engineering Utilities for Planted ML Engine
Helper functions for feature extraction, transformation, and validation
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime, timedelta
import json
import re
import logging
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeatureValidator:
    """Validates feature quality and completeness"""
    
    def __init__(self):
        self.required_features = {
            'dietary_journey': ['motivation_score', 'strictness_level', 'journey_stage', 'social_comfort'],
            'values_alignment': ['animal_rights_score', 'environmental_score', 'health_motivation', 
                               'spiritual_connection', 'activism_level'],
            'lifestyle_compatibility': ['cooking_skill_level', 'sustainability_practices', 'community_involvement'],
            'behavioral': ['swipe_selectivity', 'message_quality_score', 'response_time_pattern',
                         'engagement_depth', 'profile_completion', 'activity_frequency']
        }
    
    def validate_feature_completeness(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that all required features are present"""
        validation_results = {
            'is_valid': True,
            'missing_features': [],
            'invalid_ranges': [],
            'completeness_score': 0.0
        }
        
        total_features = 0
        present_features = 0
        
        for category, feature_list in self.required_features.items():
            for feature in feature_list:
                total_features += 1
                
                if feature not in features:
                    validation_results['missing_features'].append(feature)
                    validation_results['is_valid'] = False
                else:
                    present_features += 1
                    # Validate range (should be 0-1)
                    value = features[feature]
                    if not isinstance(value, (int, float)) or not (0 <= value <= 1):
                        validation_results['invalid_ranges'].append(f"{feature}: {value}")
                        validation_results['is_valid'] = False
        
        validation_results['completeness_score'] = present_features / total_features
        return validation_results
    
    def impute_missing_features(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Impute missing features with reasonable defaults"""
        imputed_features = features.copy()
        
        # Default values based on feature semantics
        defaults = {
            # Dietary journey - moderate defaults
            'motivation_score': 0.5,
            'strictness_level': 0.6,
            'journey_stage': 0.4,
            'social_comfort': 0.5,
            
            # Values alignment - moderate environmental/health focus
            'animal_rights_score': 0.6,
            'environmental_score': 0.7,
            'health_motivation': 0.6,
            'spiritual_connection': 0.3,
            'activism_level': 0.4,
            
            # Lifestyle compatibility - moderate skills
            'cooking_skill_level': 0.5,
            'sustainability_practices': 0.6,
            'community_involvement': 0.4,
            
            # Behavioral - average user behavior
            'swipe_selectivity': 0.3,
            'message_quality_score': 0.5,
            'response_time_pattern': 0.5,
            'engagement_depth': 0.4,
            'profile_completion': 0.7,
            'activity_frequency': 0.5
        }
        
        for feature, default_value in defaults.items():
            if feature not in imputed_features or imputed_features[feature] is None:
                imputed_features[feature] = default_value
                logger.debug(f"Imputed {feature} with default value {default_value}")
        
        return imputed_features

class TextFeatureExtractor:
    """Extracts features from text data (bios, messages, etc.)"""
    
    def __init__(self):
        # Initialize NLTK components
        try:
            nltk.download('vader_lexicon', quiet=True)
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except Exception as e:
            logger.warning(f"NLTK initialization error: {e}")
            self.sentiment_analyzer = None
        
        # Plant-based keywords for domain-specific analysis
        self.plant_based_keywords = {
            'diet_types': ['vegan', 'vegetarian', 'plant-based', 'flexitarian', 'raw vegan', 'whole food'],
            'motivations': ['animals', 'environment', 'health', 'ethics', 'spiritual', 'climate'],
            'foods': ['tofu', 'tempeh', 'seitan', 'quinoa', 'kale', 'avocado', 'nuts', 'beans'],
            'lifestyle': ['sustainable', 'organic', 'local', 'zero waste', 'mindful', 'compassionate'],
            'activities': ['activism', 'volunteering', 'cooking', 'gardening', 'meditation', 'yoga']
        }
    
    def extract_sentiment_features(self, text: str) -> Dict[str, float]:
        """Extract sentiment features from text"""
        if not text or not self.sentiment_analyzer:
            return {'sentiment_positive': 0.5, 'sentiment_negative': 0.0, 'sentiment_neutral': 0.5}
        
        try:
            # VADER sentiment analysis
            vader_scores = self.sentiment_analyzer.polarity_scores(text)
            
            # TextBlob sentiment analysis
            blob = TextBlob(text)
            textblob_polarity = (blob.sentiment.polarity + 1) / 2  # Normalize to 0-1
            
            return {
                'sentiment_positive': vader_scores['pos'],
                'sentiment_negative': vader_scores['neg'],
                'sentiment_neutral': vader_scores['neu'],
                'sentiment_compound': (vader_scores['compound'] + 1) / 2,  # Normalize to 0-1
                'sentiment_textblob': textblob_polarity,
                'sentiment_subjectivity': blob.sentiment.subjectivity
            }
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {'sentiment_positive': 0.5, 'sentiment_negative': 0.0, 'sentiment_neutral': 0.5}
    
    def extract_plant_based_signals(self, text: str) -> Dict[str, float]:
        """Extract plant-based lifestyle signals from text"""
        if not text:
            return {category: 0.0 for category in self.plant_based_keywords.keys()}
        
        text_lower = text.lower()
        signals = {}
        
        for category, keywords in self.plant_based_keywords.items():
            # Count keyword mentions
            keyword_count = sum(1 for keyword in keywords if keyword in text_lower)
            # Normalize by number of keywords in category
            signals[f'pb_{category}_signal'] = min(keyword_count / len(keywords), 1.0)
        
        # Overall plant-based signal strength
        signals['pb_overall_signal'] = np.mean(list(signals.values()))
        
        return signals
    
    def extract_text_quality_features(self, text: str) -> Dict[str, float]:
        """Extract text quality and engagement features"""
        if not text:
            return {
                'text_length': 0.0,
                'word_count': 0.0,
                'sentence_count': 0.0,
                'avg_word_length': 0.0,
                'question_ratio': 0.0,
                'exclamation_ratio': 0.0,
                'emoji_ratio': 0.0
            }
        
        # Basic text statistics
        word_count = len(text.split())
        sentence_count = len(re.split(r'[.!?]+', text))
        
        # Character analysis
        question_count = text.count('?')
        exclamation_count = text.count('!')
        emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]', text))
        
        # Average word length
        words = text.split()
        avg_word_length = np.mean([len(word) for word in words]) if words else 0
        
        return {
            'text_length': min(len(text) / 500, 1.0),  # Normalize to typical bio length
            'word_count': min(word_count / 100, 1.0),  # Normalize to typical word count
            'sentence_count': min(sentence_count / 10, 1.0),
            'avg_word_length': min(avg_word_length / 10, 1.0),
            'question_ratio': min(question_count / max(sentence_count, 1), 1.0),
            'exclamation_ratio': min(exclamation_count / max(sentence_count, 1), 1.0),
            'emoji_ratio': min(emoji_count / max(word_count, 1), 1.0)
        }

class BehavioralFeatureExtractor:
    """Extracts behavioral features from user interaction data"""
    
    def __init__(self):
        self.interaction_weights = {
            'swipe_right': 1.0,
            'swipe_left': -0.5,
            'match': 2.0,
            'message': 3.0,
            'reply': 2.5,
            'date': 5.0,
            'block': -5.0,
            'report': -10.0
        }
    
    def extract_swipe_patterns(self, swipe_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """Extract patterns from swipe behavior"""
        if not swipe_history:
            return {
                'swipe_selectivity': 0.3,  # Default moderate selectivity
                'swipe_consistency': 0.5,
                'swipe_speed': 0.5,
                'peak_activity_hour': 0.5
            }
        
        # Calculate selectivity (right swipes / total swipes)
        right_swipes = sum(1 for swipe in swipe_history if swipe.get('action') == 'swipe_right')
        total_swipes = len(swipe_history)
        selectivity = right_swipes / total_swipes if total_swipes > 0 else 0.3
        
        # Calculate consistency (std dev of daily swipe patterns)
        daily_swipes = {}
        for swipe in swipe_history:
            date = swipe.get('timestamp', datetime.now()).date()
            daily_swipes[date] = daily_swipes.get(date, 0) + 1
        
        daily_counts = list(daily_swipes.values())
        consistency = 1 - (np.std(daily_counts) / (np.mean(daily_counts) + 1e-6)) if daily_counts else 0.5
        consistency = max(0, min(1, consistency))
        
        # Calculate average swipe speed (simplified)
        if len(swipe_history) > 1:
            timestamps = [swipe.get('timestamp', datetime.now()) for swipe in swipe_history]
            time_diffs = [(timestamps[i] - timestamps[i-1]).total_seconds() 
                         for i in range(1, len(timestamps))]
            avg_time_between_swipes = np.mean(time_diffs)
            # Normalize to 0-1 (assuming 1-60 seconds is normal range)
            swipe_speed = max(0, min(1, (60 - avg_time_between_swipes) / 60))
        else:
            swipe_speed = 0.5
        
        # Find peak activity hour
        hours = [swipe.get('timestamp', datetime.now()).hour for swipe in swipe_history]
        if hours:
            peak_hour = max(set(hours), key=hours.count)
            # Normalize hour to 0-1
            peak_activity_hour = peak_hour / 24
        else:
            peak_activity_hour = 0.5
        
        return {
            'swipe_selectivity': selectivity,
            'swipe_consistency': consistency,
            'swipe_speed': swipe_speed,
            'peak_activity_hour': peak_activity_hour
        }
    
    def extract_messaging_patterns(self, message_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """Extract patterns from messaging behavior"""
        if not message_history:
            return {
                'message_quality_score': 0.5,
                'response_time_pattern': 0.5,
                'conversation_starter_ratio': 0.3,
                'message_length_consistency': 0.5
            }
        
        # Calculate message quality (based on length, sentiment, questions)
        quality_scores = []
        for message in message_history:
            text = message.get('content', '')
            if not text:
                continue
            
            # Length score (prefer moderate length)
            length_score = min(len(text) / 100, 1.0)
            
            # Question score (engaging messages have questions)
            question_score = min(text.count('?') / 3, 1.0)
            
            # Emoji score (moderate emoji use is good)
            emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F]', text))
            emoji_score = min(emoji_count / 2, 1.0)
            
            quality = (length_score + question_score + emoji_score) / 3
            quality_scores.append(quality)
        
        avg_quality = np.mean(quality_scores) if quality_scores else 0.5
        
        # Calculate response time patterns
        response_times = []
        for i, message in enumerate(message_history[1:], 1):
            prev_message = message_history[i-1]
            if (message.get('sender_id') != prev_message.get('sender_id') and
                message.get('timestamp') and prev_message.get('timestamp')):
                time_diff = (message['timestamp'] - prev_message['timestamp']).total_seconds() / 3600  # hours
                response_times.append(time_diff)
        
        if response_times:
            avg_response_time = np.mean(response_times)
            # Normalize to 0-1 (assuming 0-24 hours is normal range)
            response_pattern = max(0, min(1, (24 - avg_response_time) / 24))
        else:
            response_pattern = 0.5
        
        # Calculate conversation starter ratio
        user_messages = [msg for msg in message_history if msg.get('is_user_message', False)]
        if user_messages:
            starter_count = sum(1 for msg in user_messages if msg.get('is_conversation_starter', False))
            starter_ratio = starter_count / len(user_messages)
        else:
            starter_ratio = 0.3
        
        # Calculate message length consistency
        lengths = [len(msg.get('content', '')) for msg in message_history]
        if len(lengths) > 1:
            length_consistency = 1 - (np.std(lengths) / (np.mean(lengths) + 1e-6))
            length_consistency = max(0, min(1, length_consistency))
        else:
            length_consistency = 0.5
        
        return {
            'message_quality_score': avg_quality,
            'response_time_pattern': response_pattern,
            'conversation_starter_ratio': starter_ratio,
            'message_length_consistency': length_consistency
        }
    
    def extract_engagement_features(self, interaction_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """Extract overall engagement features"""
        if not interaction_history:
            return {
                'engagement_depth': 0.3,
                'activity_frequency': 0.5,
                'platform_loyalty': 0.5,
                'feature_usage_diversity': 0.3
            }
        
        # Calculate engagement depth using interaction weights
        engagement_scores = []
        for interaction in interaction_history:
            action = interaction.get('action', 'unknown')
            weight = self.interaction_weights.get(action, 0)
            engagement_scores.append(weight)
        
        if engagement_scores:
            # Normalize to 0-1 range
            max_possible_score = 5.0  # Max weight from 'date'
            min_possible_score = -10.0  # Min weight from 'report'
            avg_engagement = np.mean(engagement_scores)
            normalized_engagement = (avg_engagement - min_possible_score) / (max_possible_score - min_possible_score)
            engagement_depth = max(0, min(1, normalized_engagement))
        else:
            engagement_depth = 0.3
        
        # Calculate activity frequency
        if interaction_history:
            # Group by day
            daily_activity = {}
            for interaction in interaction_history:
                date = interaction.get('timestamp', datetime.now()).date()
                daily_activity[date] = daily_activity.get(date, 0) + 1
            
            # Calculate average daily activity
            if daily_activity:
                avg_daily_activity = np.mean(list(daily_activity.values()))
                # Normalize (assuming 1-20 actions per day is normal)
                activity_frequency = min(avg_daily_activity / 20, 1.0)
            else:
                activity_frequency = 0.5
        else:
            activity_frequency = 0.5
        
        # Calculate platform loyalty (days active / total days since first interaction)
        if interaction_history:
            timestamps = [interaction.get('timestamp', datetime.now()) for interaction in interaction_history]
            first_interaction = min(timestamps)
            last_interaction = max(timestamps)
            total_days = (last_interaction - first_interaction).days + 1
            
            active_days = len(set(ts.date() for ts in timestamps))
            platform_loyalty = active_days / total_days if total_days > 0 else 0.5
        else:
            platform_loyalty = 0.5
        
        # Calculate feature usage diversity
        unique_actions = set(interaction.get('action') for interaction in interaction_history)
        total_possible_actions = len(self.interaction_weights)  # All possible actions
        feature_usage_diversity = len(unique_actions) / total_possible_actions
        
        return {
            'engagement_depth': engagement_depth,
            'activity_frequency': activity_frequency,
            'platform_loyalty': platform_loyalty,
            'feature_usage_diversity': feature_usage_diversity
        }

class CompatibilityFeatureExtractor:
    """Extracts compatibility-specific features between users"""
    
    def __init__(self):
        self.feature_weights = {
            'dietary_journey': 0.25,
            'values_alignment': 0.35,
            'lifestyle_compatibility': 0.25,
            'behavioral': 0.15
        }
    
    def calculate_feature_similarity(self, user1_features: Dict[str, float], 
                                   user2_features: Dict[str, float], 
                                   feature_group: str) -> float:
        """Calculate similarity for a specific feature group"""
        if feature_group == 'dietary_journey':
            features = ['motivation_score', 'strictness_level', 'journey_stage', 'social_comfort']
        elif feature_group == 'values_alignment':
            features = ['animal_rights_score', 'environmental_score', 'health_motivation', 
                       'spiritual_connection', 'activism_level']
        elif feature_group == 'lifestyle_compatibility':
            features = ['cooking_skill_level', 'sustainability_practices', 'community_involvement']
        elif feature_group == 'behavioral':
            features = ['swipe_selectivity', 'message_quality_score', 'response_time_pattern',
                       'engagement_depth', 'profile_completion', 'activity_frequency']
        else:
            return 0.5
        
        similarities = []
        for feature in features:
            if feature in user1_features and feature in user2_features:
                # Calculate absolute difference and convert to similarity
                diff = abs(user1_features[feature] - user2_features[feature])
                similarity = 1 - diff  # Invert difference to get similarity
                similarities.append(similarity)
        
        return np.mean(similarities) if similarities else 0.5
    
    def extract_compatibility_features(self, user1_data: Dict[str, Any], 
                                     user2_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract pairwise compatibility features"""
        compatibility_features = {}
        
        # Calculate similarity for each feature group
        for group in self.feature_weights.keys():
            similarity = self.calculate_feature_similarity(user1_data, user2_data, group)
            compatibility_features[f'{group}_similarity'] = similarity
        
        # Calculate weighted overall compatibility
        overall_compatibility = sum(
            self.feature_weights[group] * compatibility_features[f'{group}_similarity']
            for group in self.feature_weights.keys()
        )
        compatibility_features['overall_compatibility'] = overall_compatibility
        
        # Calculate complementary features (where differences might be beneficial)
        complementary_pairs = [
            ('cooking_skill_level', 'community_involvement'),
            ('activism_level', 'social_comfort'),
            ('strictness_level', 'social_comfort')
        ]
        
        complementarity_scores = []
        for feature1, feature2 in complementary_pairs:
            if (feature1 in user1_data and feature2 in user2_data and
                feature1 in user2_data and feature2 in user1_data):
                
                # Check if one person is high in feature1 and the other in feature2
                score1 = user1_data[feature1] * user2_data[feature2]
                score2 = user2_data[feature1] * user1_data[feature2]
                complementarity = max(score1, score2)
                complementarity_scores.append(complementarity)
        
        compatibility_features['complementarity_score'] = (
            np.mean(complementarity_scores) if complementarity_scores else 0.3
        )
        
        return compatibility_features

class FeatureEngineeringPipeline:
    """Main feature engineering pipeline"""
    
    def __init__(self):
        self.validator = FeatureValidator()
        self.text_extractor = TextFeatureExtractor()
        self.behavioral_extractor = BehavioralFeatureExtractor()
        self.compatibility_extractor = CompatibilityFeatureExtractor()
        
        # Feature scalers
        self.scalers = {
            'standard': StandardScaler(),
            'minmax': MinMaxScaler()
        }
    
    def process_user_profile(self, raw_profile: Dict[str, Any]) -> Dict[str, float]:
        """Process raw user profile into engineered features"""
        logger.info(f"Processing user profile for user: {raw_profile.get('user_id', 'unknown')}")
        
        # Start with base features
        features = {}
        
        # Validate and impute missing features
        validation_result = self.validator.validate_feature_completeness(raw_profile)
        if not validation_result['is_valid']:
            logger.warning(f"Missing features: {validation_result['missing_features']}")
        
        imputed_profile = self.validator.impute_missing_features(raw_profile)
        
        # Add base features
        base_features = ['motivation_score', 'strictness_level', 'journey_stage', 'social_comfort',
                        'animal_rights_score', 'environmental_score', 'health_motivation',
                        'spiritual_connection', 'activism_level', 'cooking_skill_level',
                        'sustainability_practices', 'community_involvement']
        
        for feature in base_features:
            features[feature] = imputed_profile.get(feature, 0.5)
        
        # Extract text features from bio
        if 'bio' in raw_profile and raw_profile['bio']:
            sentiment_features = self.text_extractor.extract_sentiment_features(raw_profile['bio'])
            pb_signals = self.text_extractor.extract_plant_based_signals(raw_profile['bio'])
            text_quality = self.text_extractor.extract_text_quality_features(raw_profile['bio'])
            
            features.update(sentiment_features)
            features.update(pb_signals)
            features.update(text_quality)
        
        # Extract behavioral features
        if 'swipe_history' in raw_profile:
            swipe_features = self.behavioral_extractor.extract_swipe_patterns(raw_profile['swipe_history'])
            features.update(swipe_features)
        
        if 'message_history' in raw_profile:
            message_features = self.behavioral_extractor.extract_messaging_patterns(raw_profile['message_history'])
            features.update(message_features)
        
        if 'interaction_history' in raw_profile:
            engagement_features = self.behavioral_extractor.extract_engagement_features(raw_profile['interaction_history'])
            features.update(engagement_features)
        
        # Add derived features
        features['profile_completeness'] = validation_result['completeness_score']
        
        # Calculate composite scores
        features['plant_based_commitment'] = np.mean([
            features.get('motivation_score', 0.5),
            features.get('strictness_level', 0.5),
            features.get('animal_rights_score', 0.5),
            features.get('activism_level', 0.5)
        ])
        
        features['lifestyle_alignment'] = np.mean([
            features.get('environmental_score', 0.5),
            features.get('sustainability_practices', 0.5),
            features.get('cooking_skill_level', 0.5)
        ])
        
        logger.info(f"Extracted {len(features)} features for user profile")
        return features
    
    def create_compatibility_features(self, user1_profile: Dict[str, Any], 
                                    user2_profile: Dict[str, Any]) -> Dict[str, float]:
        """Create compatibility features between two users"""
        # Process individual profiles
        user1_features = self.process_user_profile(user1_profile)
        user2_features = self.process_user_profile(user2_profile)
        
        # Extract compatibility features
        compatibility_features = self.compatibility_extractor.extract_compatibility_features(
            user1_features, user2_features
        )
        
        # Combine all features
        combined_features = {}
        
        # Add individual features with prefixes
        for key, value in user1_features.items():
            combined_features[f'user1_{key}'] = value
        
        for key, value in user2_features.items():
            combined_features[f'user2_{key}'] = value
        
        # Add compatibility features
        combined_features.update(compatibility_features)
        
        return combined_features
    
    def scale_features(self, features: Dict[str, float], 
                      scaler_type: str = 'minmax') -> Dict[str, float]:
        """Scale features using specified scaler"""
        if scaler_type not in self.scalers:
            logger.warning(f"Unknown scaler type: {scaler_type}, using minmax")
            scaler_type = 'minmax'
        
        # Prepare data for scaling
        feature_names = list(features.keys())
        feature_values = np.array(list(features.values())).reshape(1, -1)
        
        # Scale features
        scaler = self.scalers[scaler_type]
        scaled_values = scaler.fit_transform(feature_values).flatten()
        
        # Return scaled features
        return dict(zip(feature_names, scaled_values))

# Example usage
if __name__ == "__main__":
    # Create feature engineering pipeline
    pipeline = FeatureEngineeringPipeline()
    
    # Example raw user profile
    raw_profile = {
        'user_id': 'user123',
        'bio': 'Passionate about animal rights and sustainable living! Love cooking plant-based meals and practicing yoga. Looking for someone who shares my values 🌱',
        'motivation_score': 0.8,
        'strictness_level': 0.9,
        'journey_stage': 0.7,
        'animal_rights_score': 0.9,
        'environmental_score': 0.8,
        'cooking_skill_level': 0.7,
        'swipe_history': [
            {'action': 'swipe_right', 'timestamp': datetime.now() - timedelta(days=1)},
            {'action': 'swipe_left', 'timestamp': datetime.now() - timedelta(days=1)},
            {'action': 'swipe_right', 'timestamp': datetime.now()}
        ],
        'message_history': [
            {'content': 'Hi! I noticed you love hiking too! What are your favorite trails?', 
             'timestamp': datetime.now(), 'is_user_message': True, 'is_conversation_starter': True}
        ]
    }
    
    # Process profile
    features = pipeline.process_user_profile(raw_profile)
    print(f"Extracted {len(features)} features:")
    for key, value in sorted(features.items()):
        print(f"  {key}: {value:.3f}")
    
    # Create compatibility features with another user
    raw_profile2 = raw_profile.copy()
    raw_profile2['user_id'] = 'user456'
    raw_profile2['strictness_level'] = 0.6  # Slightly different
    
    compatibility_features = pipeline.create_compatibility_features(raw_profile, raw_profile2)
    print(f"\nCompatibility features ({len(compatibility_features)} total):")
    for key, value in sorted(compatibility_features.items()):
        if 'compatibility' in key or 'similarity' in key:
            print(f"  {key}: {value:.3f}")