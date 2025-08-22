"""
Comprehensive Model Evaluation Framework for Planted ML Engine
Includes ranking metrics, A/B testing, fairness evaluation, and performance monitoring
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import logging
from datetime import datetime, timedelta
from sklearn.metrics import ndcg_score, mean_squared_error, mean_absolute_error
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
from scipy.stats import pearsonr, spearmanr
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EvaluationMetrics:
    """Container for evaluation metrics"""
    # Ranking metrics
    ndcg_at_5: float = 0.0
    ndcg_at_10: float = 0.0
    ndcg_at_20: float = 0.0
    map_at_10: float = 0.0
    mrr: float = 0.0
    
    # Classification metrics
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    auc_roc: float = 0.0
    
    # Regression metrics
    mse: float = 0.0
    mae: float = 0.0
    rmse: float = 0.0
    pearson_correlation: float = 0.0
    spearman_correlation: float = 0.0
    
    # Diversity metrics
    intra_list_diversity: float = 0.0
    coverage: float = 0.0
    novelty: float = 0.0
    
    # Fairness metrics
    demographic_parity: float = 0.0
    equalized_odds: float = 0.0
    calibration_error: float = 0.0
    
    # Business metrics
    user_satisfaction: float = 0.0
    engagement_rate: float = 0.0
    conversion_rate: float = 0.0

class RankingEvaluator:
    """Evaluates ranking performance using various metrics"""
    
    def __init__(self):
        self.metrics_history = []
    
    def calculate_ndcg(self, y_true: np.ndarray, y_score: np.ndarray, k: int = 10) -> float:
        """Calculate Normalized Discounted Cumulative Gain at k"""
        try:
            # Ensure we have at least k items
            if len(y_true) < k:
                k = len(y_true)
            
            # Calculate NDCG
            ndcg = ndcg_score(y_true.reshape(1, -1), y_score.reshape(1, -1), k=k)
            return ndcg
        except Exception as e:
            logger.error(f"NDCG calculation error: {e}")
            return 0.0
    
    def calculate_map_at_k(self, y_true: np.ndarray, y_score: np.ndarray, k: int = 10) -> float:
        """Calculate Mean Average Precision at k"""
        try:
            # Sort by predicted scores
            sorted_indices = np.argsort(y_score)[::-1]
            y_true_sorted = y_true[sorted_indices]
            
            # Calculate precision at each relevant position
            precisions = []
            relevant_count = 0
            
            for i in range(min(k, len(y_true_sorted))):
                if y_true_sorted[i] > 0:  # Relevant item
                    relevant_count += 1
                    precision_at_i = relevant_count / (i + 1)
                    precisions.append(precision_at_i)
            
            return np.mean(precisions) if precisions else 0.0
        except Exception as e:
            logger.error(f"MAP calculation error: {e}")
            return 0.0
    
    def calculate_mrr(self, y_true: np.ndarray, y_score: np.ndarray) -> float:
        """Calculate Mean Reciprocal Rank"""
        try:
            # Sort by predicted scores
            sorted_indices = np.argsort(y_score)[::-1]
            y_true_sorted = y_true[sorted_indices]
            
            # Find first relevant item
            for i, relevance in enumerate(y_true_sorted):
                if relevance > 0:
                    return 1.0 / (i + 1)
            
            return 0.0
        except Exception as e:
            logger.error(f"MRR calculation error: {e}")
            return 0.0
    
    def evaluate_ranking(self, predictions: List[List[Tuple[str, float]]], 
                        ground_truth: Dict[str, List[str]]) -> Dict[str, float]:
        """Evaluate ranking performance for multiple users"""
        ndcg_5_scores = []
        ndcg_10_scores = []
        ndcg_20_scores = []
        map_10_scores = []
        mrr_scores = []
        
        for i, user_predictions in enumerate(predictions):
            user_id = f"user_{i}"  # In practice, would use actual user IDs
            
            if user_id not in ground_truth:
                continue
            
            # Create relevance vector
            predicted_items = [item_id for item_id, score in user_predictions]
            predicted_scores = np.array([score for item_id, score in user_predictions])
            
            relevant_items = set(ground_truth[user_id])
            y_true = np.array([1 if item in relevant_items else 0 for item in predicted_items])
            
            # Calculate metrics
            ndcg_5_scores.append(self.calculate_ndcg(y_true, predicted_scores, k=5))
            ndcg_10_scores.append(self.calculate_ndcg(y_true, predicted_scores, k=10))
            ndcg_20_scores.append(self.calculate_ndcg(y_true, predicted_scores, k=20))
            map_10_scores.append(self.calculate_map_at_k(y_true, predicted_scores, k=10))
            mrr_scores.append(self.calculate_mrr(y_true, predicted_scores))
        
        return {
            'ndcg@5': np.mean(ndcg_5_scores),
            'ndcg@10': np.mean(ndcg_10_scores),
            'ndcg@20': np.mean(ndcg_20_scores),
            'map@10': np.mean(map_10_scores),
            'mrr': np.mean(mrr_scores)
        }

class DiversityEvaluator:
    """Evaluates recommendation diversity and coverage"""
    
    def calculate_intra_list_diversity(self, recommendations: List[List[Tuple[str, float]]], 
                                     item_features: Dict[str, np.ndarray]) -> float:
        """Calculate average intra-list diversity"""
        diversity_scores = []
        
        for rec_list in recommendations:
            if len(rec_list) < 2:
                continue
            
            # Calculate pairwise diversity within the list
            pairwise_diversities = []
            for i in range(len(rec_list)):
                for j in range(i + 1, len(rec_list)):
                    item1_id, _ = rec_list[i]
                    item2_id, _ = rec_list[j]
                    
                    if item1_id in item_features and item2_id in item_features:
                        # Calculate cosine distance
                        features1 = item_features[item1_id]
                        features2 = item_features[item2_id]
                        
                        cosine_sim = np.dot(features1, features2) / (
                            np.linalg.norm(features1) * np.linalg.norm(features2)
                        )
                        diversity = 1 - cosine_sim
                        pairwise_diversities.append(diversity)
            
            if pairwise_diversities:
                diversity_scores.append(np.mean(pairwise_diversities))
        
        return np.mean(diversity_scores) if diversity_scores else 0.0
    
    def calculate_coverage(self, recommendations: List[List[Tuple[str, float]]], 
                          total_items: int) -> float:
        """Calculate catalog coverage"""
        recommended_items = set()
        
        for rec_list in recommendations:
            for item_id, _ in rec_list:
                recommended_items.add(item_id)
        
        return len(recommended_items) / total_items if total_items > 0 else 0.0
    
    def calculate_novelty(self, recommendations: List[List[Tuple[str, float]]], 
                         item_popularity: Dict[str, float]) -> float:
        """Calculate average recommendation novelty"""
        novelty_scores = []
        
        for rec_list in recommendations:
            list_novelty = []
            for item_id, _ in rec_list:
                if item_id in item_popularity:
                    # Novelty is inverse of popularity
                    novelty = -np.log2(item_popularity[item_id])
                    list_novelty.append(novelty)
            
            if list_novelty:
                novelty_scores.append(np.mean(list_novelty))
        
        return np.mean(novelty_scores) if novelty_scores else 0.0

class FairnessEvaluator:
    """Evaluates fairness and bias in recommendations"""
    
    def __init__(self, protected_attributes: List[str]):
        self.protected_attributes = protected_attributes
    
    def calculate_demographic_parity(self, predictions: np.ndarray, 
                                   protected_groups: np.ndarray) -> float:
        """Calculate demographic parity difference"""
        try:
            groups = np.unique(protected_groups)
            positive_rates = []
            
            for group in groups:
                group_mask = protected_groups == group
                group_predictions = predictions[group_mask]
                positive_rate = np.mean(group_predictions > 0.5)
                positive_rates.append(positive_rate)
            
            # Return maximum difference between groups
            return max(positive_rates) - min(positive_rates)
        except Exception as e:
            logger.error(f"Demographic parity calculation error: {e}")
            return 0.0
    
    def calculate_equalized_odds(self, predictions: np.ndarray, y_true: np.ndarray, 
                               protected_groups: np.ndarray) -> float:
        """Calculate equalized odds difference"""
        try:
            groups = np.unique(protected_groups)
            tpr_differences = []
            fpr_differences = []
            
            for outcome in [0, 1]:  # For each true outcome
                outcome_mask = y_true == outcome
                group_rates = []
                
                for group in groups:
                    group_mask = (protected_groups == group) & outcome_mask
                    if np.sum(group_mask) == 0:
                        continue
                    
                    group_predictions = predictions[group_mask]
                    positive_rate = np.mean(group_predictions > 0.5)
                    group_rates.append(positive_rate)
                
                if len(group_rates) >= 2:
                    if outcome == 1:
                        tpr_differences.append(max(group_rates) - min(group_rates))
                    else:
                        fpr_differences.append(max(group_rates) - min(group_rates))
            
            # Return average of TPR and FPR differences
            all_differences = tpr_differences + fpr_differences
            return np.mean(all_differences) if all_differences else 0.0
        except Exception as e:
            logger.error(f"Equalized odds calculation error: {e}")
            return 0.0
    
    def calculate_calibration_error(self, predictions: np.ndarray, y_true: np.ndarray, 
                                  n_bins: int = 10) -> float:
        """Calculate calibration error"""
        try:
            bin_boundaries = np.linspace(0, 1, n_bins + 1)
            bin_lowers = bin_boundaries[:-1]
            bin_uppers = bin_boundaries[1:]
            
            calibration_error = 0.0
            
            for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
                in_bin = (predictions > bin_lower) & (predictions <= bin_upper)
                prop_in_bin = in_bin.mean()
                
                if prop_in_bin > 0:
                    accuracy_in_bin = y_true[in_bin].mean()
                    avg_confidence_in_bin = predictions[in_bin].mean()
                    calibration_error += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            
            return calibration_error
        except Exception as e:
            logger.error(f"Calibration error calculation error: {e}")
            return 0.0

class ABTestEvaluator:
    """A/B testing framework for model comparison"""
    
    def __init__(self, significance_level: float = 0.05, power: float = 0.8):
        self.significance_level = significance_level
        self.power = power
    
    def calculate_sample_size(self, baseline_rate: float, minimum_detectable_effect: float) -> int:
        """Calculate required sample size for A/B test"""
        # Simplified sample size calculation
        # In practice, use proper power analysis
        
        alpha = self.significance_level
        beta = 1 - self.power
        
        # Z-scores for alpha/2 and beta
        z_alpha = stats.norm.ppf(1 - alpha/2)
        z_beta = stats.norm.ppf(1 - beta)
        
        # Pooled standard deviation
        p1 = baseline_rate
        p2 = baseline_rate + minimum_detectable_effect
        p_pooled = (p1 + p2) / 2
        
        # Sample size calculation
        numerator = (z_alpha + z_beta) ** 2 * 2 * p_pooled * (1 - p_pooled)
        denominator = (p2 - p1) ** 2
        
        n = numerator / denominator
        return int(np.ceil(n))
    
    def run_ab_test(self, control_metrics: Dict[str, float], 
                   treatment_metrics: Dict[str, float], 
                   sample_sizes: Dict[str, int]) -> Dict[str, Any]:
        """Run A/B test comparison"""
        results = {}
        
        for metric_name in control_metrics.keys():
            if metric_name not in treatment_metrics:
                continue
            
            control_value = control_metrics[metric_name]
            treatment_value = treatment_metrics[metric_name]
            
            # Calculate relative improvement
            relative_improvement = (treatment_value - control_value) / control_value if control_value != 0 else 0
            
            # Simple statistical test (in practice, use proper test based on metric type)
            # For demonstration, using normal approximation
            pooled_std = np.sqrt((control_value * (1 - control_value) / sample_sizes.get('control', 1000)) +
                                (treatment_value * (1 - treatment_value) / sample_sizes.get('treatment', 1000)))
            
            if pooled_std > 0:
                z_score = (treatment_value - control_value) / pooled_std
                p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
            else:
                z_score = 0
                p_value = 1.0
            
            is_significant = p_value < self.significance_level
            
            results[metric_name] = {
                'control_value': control_value,
                'treatment_value': treatment_value,
                'relative_improvement': relative_improvement,
                'absolute_improvement': treatment_value - control_value,
                'p_value': p_value,
                'is_significant': is_significant,
                'confidence_level': 1 - self.significance_level
            }
        
        return results

class ComprehensiveEvaluator:
    """Main evaluation orchestrator"""
    
    def __init__(self, protected_attributes: List[str] = None):
        self.ranking_evaluator = RankingEvaluator()
        self.diversity_evaluator = DiversityEvaluator()
        self.fairness_evaluator = FairnessEvaluator(protected_attributes or [])
        self.ab_test_evaluator = ABTestEvaluator()
        
    def evaluate_model_performance(self, 
                                 predictions: np.ndarray,
                                 y_true: np.ndarray,
                                 recommendations: List[List[Tuple[str, float]]] = None,
                                 ground_truth_rankings: Dict[str, List[str]] = None,
                                 item_features: Dict[str, np.ndarray] = None,
                                 item_popularity: Dict[str, float] = None,
                                 protected_groups: np.ndarray = None) -> EvaluationMetrics:
        """Comprehensive model evaluation"""
        
        logger.info("Starting comprehensive model evaluation")
        metrics = EvaluationMetrics()
        
        # Basic regression metrics
        try:
            metrics.mse = mean_squared_error(y_true, predictions)
            metrics.mae = mean_absolute_error(y_true, predictions)
            metrics.rmse = np.sqrt(metrics.mse)
            metrics.pearson_correlation, _ = pearsonr(y_true, predictions)
            metrics.spearman_correlation, _ = spearmanr(y_true, predictions)
        except Exception as e:
            logger.error(f"Regression metrics calculation error: {e}")
        
        # Classification metrics (assuming threshold of 0.5)
        try:
            y_pred_binary = (predictions > 0.5).astype(int)
            y_true_binary = (y_true > 0.5).astype(int)
            
            metrics.precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
            metrics.recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
            metrics.f1_score = f1_score(y_true_binary, y_pred_binary, zero_division=0)
            metrics.auc_roc = roc_auc_score(y_true_binary, predictions)
        except Exception as e:
            logger.error(f"Classification metrics calculation error: {e}")
        
        # Ranking metrics
        if recommendations and ground_truth_rankings:
            try:
                ranking_metrics = self.ranking_evaluator.evaluate_ranking(
                    recommendations, ground_truth_rankings
                )
                metrics.ndcg_at_5 = ranking_metrics.get('ndcg@5', 0.0)
                metrics.ndcg_at_10 = ranking_metrics.get('ndcg@10', 0.0)
                metrics.ndcg_at_20 = ranking_metrics.get('ndcg@20', 0.0)
                metrics.map_at_10 = ranking_metrics.get('map@10', 0.0)
                metrics.mrr = ranking_metrics.get('mrr', 0.0)
            except Exception as e:
                logger.error(f"Ranking metrics calculation error: {e}")
        
        # Diversity metrics
        if recommendations and item_features:
            try:
                metrics.intra_list_diversity = self.diversity_evaluator.calculate_intra_list_diversity(
                    recommendations, item_features
                )
                metrics.coverage = self.diversity_evaluator.calculate_coverage(
                    recommendations, len(item_features)
                )
                
                if item_popularity:
                    metrics.novelty = self.diversity_evaluator.calculate_novelty(
                        recommendations, item_popularity
                    )
            except Exception as e:
                logger.error(f"Diversity metrics calculation error: {e}")
        
        # Fairness metrics
        if protected_groups is not None:
            try:
                metrics.demographic_parity = self.fairness_evaluator.calculate_demographic_parity(
                    predictions, protected_groups
                )
                metrics.equalized_odds = self.fairness_evaluator.calculate_equalized_odds(
                    predictions, y_true_binary, protected_groups
                )
                metrics.calibration_error = self.fairness_evaluator.calculate_calibration_error(
                    predictions, y_true_binary
                )
            except Exception as e:
                logger.error(f"Fairness metrics calculation error: {e}")
        
        logger.info("Model evaluation completed")
        return metrics
    
    def generate_evaluation_report(self, metrics: EvaluationMetrics, 
                                 model_name: str = "PlantedRecommender") -> str:
        """Generate comprehensive evaluation report"""
        
        report = f"""
# {model_name} - Model Evaluation Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Performance Summary

### Ranking Performance
- NDCG@5: {metrics.ndcg_at_5:.4f}
- NDCG@10: {metrics.ndcg_at_10:.4f}
- NDCG@20: {metrics.ndcg_at_20:.4f}
- MAP@10: {metrics.map_at_10:.4f}
- MRR: {metrics.mrr:.4f}

### Classification Performance
- Precision: {metrics.precision:.4f}
- Recall: {metrics.recall:.4f}
- F1-Score: {metrics.f1_score:.4f}
- AUC-ROC: {metrics.auc_roc:.4f}

### Regression Performance
- RMSE: {metrics.rmse:.4f}
- MAE: {metrics.mae:.4f}
- Pearson Correlation: {metrics.pearson_correlation:.4f}
- Spearman Correlation: {metrics.spearman_correlation:.4f}

### Diversity & Coverage
- Intra-list Diversity: {metrics.intra_list_diversity:.4f}
- Coverage: {metrics.coverage:.4f}
- Novelty: {metrics.novelty:.4f}

### Fairness Metrics
- Demographic Parity: {metrics.demographic_parity:.4f}
- Equalized Odds: {metrics.equalized_odds:.4f}
- Calibration Error: {metrics.calibration_error:.4f}

### Business Metrics
- User Satisfaction: {metrics.user_satisfaction:.4f}
- Engagement Rate: {metrics.engagement_rate:.4f}
- Conversion Rate: {metrics.conversion_rate:.4f}

## Recommendations

### Performance
{'✅ Excellent' if metrics.ndcg_at_10 > 0.8 else '⚠️ Needs Improvement' if metrics.ndcg_at_10 > 0.6 else '❌ Poor'} - NDCG@10 performance
{'✅ Excellent' if metrics.f1_score > 0.8 else '⚠️ Needs Improvement' if metrics.f1_score > 0.6 else '❌ Poor'} - Classification performance

### Fairness
{'✅ Fair' if metrics.demographic_parity < 0.1 else '⚠️ Biased' if metrics.demographic_parity < 0.2 else '❌ Highly Biased'} - Demographic parity
{'✅ Well Calibrated' if metrics.calibration_error < 0.1 else '⚠️ Poorly Calibrated'} - Model calibration

### Diversity
{'✅ Diverse' if metrics.intra_list_diversity > 0.3 else '⚠️ Low Diversity'} - Recommendation diversity
{'✅ Good Coverage' if metrics.coverage > 0.5 else '⚠️ Low Coverage'} - Catalog coverage

## Next Steps
1. Monitor model performance in production
2. Collect user feedback for continuous improvement
3. Regular fairness audits and bias mitigation
4. A/B test alternative algorithms and parameters
"""
        
        return report
    
    def save_evaluation_results(self, metrics: EvaluationMetrics, 
                              filepath: str, model_version: str = None):
        """Save evaluation results to file"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'model_version': model_version,
            'metrics': {
                'ranking': {
                    'ndcg_at_5': metrics.ndcg_at_5,
                    'ndcg_at_10': metrics.ndcg_at_10,
                    'ndcg_at_20': metrics.ndcg_at_20,
                    'map_at_10': metrics.map_at_10,
                    'mrr': metrics.mrr
                },
                'classification': {
                    'precision': metrics.precision,
                    'recall': metrics.recall,
                    'f1_score': metrics.f1_score,
                    'auc_roc': metrics.auc_roc
                },
                'regression': {
                    'mse': metrics.mse,
                    'mae': metrics.mae,
                    'rmse': metrics.rmse,
                    'pearson_correlation': metrics.pearson_correlation,
                    'spearman_correlation': metrics.spearman_correlation
                },
                'diversity': {
                    'intra_list_diversity': metrics.intra_list_diversity,
                    'coverage': metrics.coverage,
                    'novelty': metrics.novelty
                },
                'fairness': {
                    'demographic_parity': metrics.demographic_parity,
                    'equalized_odds': metrics.equalized_odds,
                    'calibration_error': metrics.calibration_error
                },
                'business': {
                    'user_satisfaction': metrics.user_satisfaction,
                    'engagement_rate': metrics.engagement_rate,
                    'conversion_rate': metrics.conversion_rate
                }
            }
        }
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Evaluation results saved to {filepath}")

# Example usage
if __name__ == "__main__":
    # Create sample data for testing
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic predictions and ground truth
    y_true = np.random.beta(2, 2, n_samples)
    predictions = y_true + np.random.normal(0, 0.1, n_samples)
    predictions = np.clip(predictions, 0, 1)
    
    # Generate synthetic recommendations
    recommendations = []
    for i in range(100):  # 100 users
        user_recs = [(f"item_{j}", np.random.random()) for j in range(10)]
        user_recs.sort(key=lambda x: x[1], reverse=True)
        recommendations.append(user_recs)
    
    # Generate synthetic ground truth rankings
    ground_truth = {f"user_{i}": [f"item_{j}" for j in np.random.choice(100, 5, replace=False)] 
                   for i in range(100)}
    
    # Create evaluator and run evaluation
    evaluator = ComprehensiveEvaluator()
    metrics = evaluator.evaluate_model_performance(
        predictions=predictions[:100],  # Match with number of users
        y_true=y_true[:100],
        recommendations=recommendations,
        ground_truth_rankings=ground_truth
    )
    
    # Generate and print report
    report = evaluator.generate_evaluation_report(metrics)
    print(report)
    
    # Save results
    evaluator.save_evaluation_results(metrics, "evaluation_results.json", "v1.0.0")