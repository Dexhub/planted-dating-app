# Planted Data Science Framework

A comprehensive data science framework for the Planted plant-based dating app, providing statistical modeling, algorithm validation, and continuous optimization for matching compatibility prediction.

## Overview

This framework implements advanced machine learning and statistical techniques specifically designed for plant-based dating compatibility prediction, including:

- **Feature Engineering**: Comprehensive user profile and interaction feature extraction
- **Statistical Models**: Bayesian compatibility models, clustering analysis, and survival modeling
- **Validation Framework**: Cross-validation, bias detection, and fairness metrics
- **Personalization**: Individual preference learning and temporal pattern analysis
- **Performance Analytics**: Algorithm effectiveness and business impact measurement
- **Continuous Learning**: Online learning and batch retraining pipelines

## Architecture

```
├── feature-engineering.js     # User and interaction feature extraction
├── statistical-models.js      # Bayesian, clustering, and survival models
├── model-validation.js        # Cross-validation and bias detection
├── personalization-models.js  # Individual preferences and temporal patterns
├── performance-analytics.js   # Algorithm and business metrics
├── continuous-learning.js     # Online learning and retraining
└── index.js                  # Main framework integration
```

## Quick Start

### Basic Usage

```javascript
const { createPlantedDataScienceFramework } = require('./data-science');

// Initialize framework
const framework = createPlantedDataScienceFramework({
  modelRetrainingSchedule: {
    online: true,
    daily: true,
    weekly: true
  },
  biasDetectionEnabled: true,
  performanceMonitoringEnabled: true
});

// Predict compatibility between two users
const compatibility = await framework.predictCompatibility(user1Id, user2Id, {
  personalized: true,
  includeTemporal: true
});

console.log(`Compatibility Score: ${compatibility.compatibility_score}`);
console.log(`Confidence: ${compatibility.confidence}`);
console.log(`Explanation: ${compatibility.explanation.join(', ')}`);
```

### Algorithm Evaluation

```javascript
// Comprehensive algorithm evaluation
const evaluation = await framework.evaluateAlgorithmPerformance(30); // 30 days

console.log('Algorithm Performance:');
console.log(`- Precision@10: ${evaluation.algorithm_performance.precision.precision_at_10}`);
console.log(`- NDCG@10: ${evaluation.algorithm_performance.ranking.ndcg_at_10}`);
console.log(`- Diversity Score: ${evaluation.algorithm_performance.diversity.intra_list_diversity}`);

console.log('Business Impact:');
console.log(`- Match Rate: ${evaluation.business_impact.conversion.match_rate}`);
console.log(`- Retention Rate: ${evaluation.business_impact.retention.day_30_retention}`);
console.log(`- Revenue Impact: $${evaluation.business_impact.revenue.monthly_recurring_revenue}`);
```

### A/B Testing

```javascript
// Run A/B test for algorithm improvements
const abTest = await framework.runABTest(currentModel, improvedModel, {
  testDuration: 14, // days
  trafficSplit: 0.1, // 10% to treatment
  significanceLevel: 0.05
});

console.log('A/B Test Results:');
console.log(`- Statistical Significance: ${abTest.statistical_results.statisticalAnalysis.isSignificant}`);
console.log(`- Business Impact: ${abTest.business_impact.estimatedLift}%`);
console.log(`- Recommendation: ${abTest.recommendations.deployment}`);
```

## Core Components

### 1. Feature Engineering

Extracts comprehensive features from user profiles and interactions:

**User Profile Features:**
- Demographic vectors (age, location, education)
- Dietary journey features (years plant-based, motivations)
- Values alignment vectors (ethical priorities)
- Behavioral patterns (app usage, response times)

**Interaction Features:**
- Swipe patterns and decision times
- Message engagement metrics
- Profile viewing behavior
- Feedback quality indicators

```javascript
const { UserFeatureExtractor } = require('./data-science');

// Extract user features
const userFeatures = UserFeatureExtractor.extractDemographicFeatures(user);
const dietaryFeatures = UserFeatureExtractor.extractDietaryJourneyFeatures(user);
const valuesFeatures = UserFeatureExtractor.extractValuesAlignmentFeatures(user);
```

### 2. Statistical Models

#### Bayesian Compatibility Model
Uses Bayesian inference to predict compatibility with prior beliefs updated by user behavior:

```javascript
const { BayesianCompatibilityModel } = require('./data-science');

const model = new BayesianCompatibilityModel();

// Calculate base compatibility
const baseScore = model.calculateBaseCompatibility(user1Features, user2Features);

// Update with behavioral evidence
const finalScore = model.updateWithBehavioralEvidence(
  baseScore, 
  user1Behavior, 
  user2Behavior, 
  interactionHistory
);
```

#### Clustering Analysis
Identifies user personas and compatibility groups:

```javascript
const { CompatibilityClusteringModel } = require('./data-science');

const clustering = new CompatibilityClusteringModel();

// Perform user clustering
const clusters = await clustering.clusterUsers(userFeatures);

// Analyze compatibility between clusters
const compatibility = clustering.analyzeClusterCompatibility(interactionHistory);
```

#### Survival Analysis
Predicts relationship duration and success probability:

```javascript
const { RelationshipSurvivalModel } = require('./data-science');

const survival = new RelationshipSurvivalModel();

// Build survival model
const model = survival.buildSurvivalModel(relationshipData);

// Predict relationship success
const prediction = survival.predictRelationshipSuccess(compatibilityFeatures, [30, 90, 180]);
```

### 3. Model Validation

Comprehensive validation including cross-validation and bias detection:

```javascript
const { ModelValidationFramework } = require('./data-science');

const validation = new ModelValidationFramework();

// Time-based cross-validation
const cvResults = await validation.performTimeBasedCrossValidation(data, model, 5);

// Bias detection
const biasResults = await validation.detectBias(model, testData);

console.log(`Model Validity: ${cvResults.isValid}`);
console.log(`Bias Assessment: ${biasResults.overallBias.overallBiasLevel}`);
```

### 4. Personalization Models

#### Individual Preference Learning
Learns user-specific preferences and adjusts matching weights:

```javascript
const { IndividualPreferenceLearningModel } = require('./data-science');

const preferences = new IndividualPreferenceLearningModel();

// Learn user preferences from interaction history
const userWeights = await preferences.learnUserPreferences(userId, interactionHistory);

// Get personalized compatibility score
const personalizedScore = preferences.getPersonalizedCompatibilityScore(
  userId, 
  targetProfile, 
  baseScore
);
```

#### Temporal Patterns
Analyzes how user behavior changes over time:

```javascript
const { TemporalPatternsModel } = require('./data-science');

const temporal = new TemporalPatternsModel();

// Analyze temporal patterns
const patterns = temporal.analyzeTemporalPatterns(userId, interactionHistory);

// Predict future behavior
const predictions = temporal.predictFutureBehavior(userId, 7); // 7 days ahead
```

### 5. Performance Analytics

#### Algorithm Effectiveness
Tracks precision, recall, NDCG, diversity, and coverage metrics:

```javascript
const { AlgorithmEffectivenessAnalyzer } = require('./data-science');

const analytics = new AlgorithmEffectivenessAnalyzer();

// Calculate effectiveness metrics
const metrics = await analytics.calculateEffectivenessMetrics(
  recommendations, 
  userInteractions, 
  30
);

// Generate performance report
const report = analytics.generatePerformanceReport();
```

#### Business Impact Analysis
Tracks user engagement, retention, and revenue metrics:

```javascript
const { BusinessImpactAnalyzer } = require('./data-science');

const business = new BusinessImpactAnalyzer();

// Calculate business impact
const impact = await business.calculateBusinessImpact(userData, matchData, revenueData);

// Generate business report
const report = business.generateBusinessReport();
```

### 6. Continuous Learning

#### Online Learning System
Real-time model updates from user interactions:

```javascript
const { OnlineLearningSystem } = require('./data-science');

const onlineLearning = new OnlineLearningSystem();

// Process real-time interaction
await onlineLearning.processInteraction({
  userId: '12345',
  targetUserId: '67890',
  action: 'like',
  timestamp: new Date(),
  context: {}
});
```

#### Batch Retraining System
Periodic full model retraining:

```javascript
const { BatchRetrainingSystem } = require('./data-science');

const batchTraining = new BatchRetrainingSystem();

// Schedule retraining
await batchTraining.scheduleRetraining();
```

#### Feature Importance Analysis
Understands which features drive successful matches:

```javascript
const { FeatureImportanceAnalyzer } = require('./data-science');

const importance = new FeatureImportanceAnalyzer();

// Analyze feature importance
const analysis = await importance.analyzeFeatureImportance(model, trainingData);

// Generate insights
const insights = importance.generateImportanceInsights();
```

#### Anomaly Detection
Identifies unusual patterns or potential issues:

```javascript
const { AnomalyDetectionSystem } = require('./data-science');

const anomalies = new AnomalyDetectionSystem();

// Detect anomalies
const detected = await anomalies.detectAnomalies(currentMetrics, historicalData);

// Generate anomaly report
const report = anomalies.generateAnomalyReport();
```

## Performance Metrics

### Algorithm Metrics
- **Precision@K**: Percentage of top K recommendations that are relevant
- **NDCG@K**: Normalized Discounted Cumulative Gain for ranking quality
- **Diversity**: Intra-list and inter-list diversity measures
- **Coverage**: User and item coverage across demographics
- **Novelty**: How many recommendations are new to users

### Business Metrics
- **Match Rate**: Percentage of recommendations resulting in matches
- **Conversation Rate**: Percentage of matches leading to conversations
- **Date Conversion**: Percentage of conversations leading to dates
- **User Retention**: 1-day, 7-day, 30-day, and 90-day retention rates
- **Revenue Impact**: MRR, CLV, and conversion rates

### Fairness Metrics
- **Demographic Parity**: Equal match rates across groups
- **Equalized Odds**: Equal true positive rates across groups
- **Calibration**: Equal positive predictive values across groups
- **Individual Fairness**: Similar predictions for similar individuals

## Configuration

### Framework Configuration

```javascript
const config = {
  // Feature engineering settings
  featureUpdateInterval: 3600000, // 1 hour in milliseconds
  
  // Model retraining schedule
  modelRetrainingSchedule: {
    online: true,      // Enable online learning
    daily: true,       // Daily batch retraining
    weekly: true,      // Weekly comprehensive retraining
    monthly: true      // Monthly full retraining
  },
  
  // Validation settings
  crossValidationFolds: 5,
  biasDetectionEnabled: true,
  fairnessThresholds: {
    demographic_parity: 0.05,    // 5% maximum disparity
    equalized_odds: 0.05,        // 5% maximum disparity
    individual_fairness: 0.1     // 10% maximum difference
  },
  
  // Performance monitoring
  performanceMonitoringEnabled: true,
  anomalyDetectionEnabled: true,
  
  // Business metrics
  businessMetricsEnabled: true,
  kpiTrackingEnabled: true
};
```

### Model Parameters

```javascript
// Bayesian model configuration
const bayesianConfig = {
  priorBeliefs: {
    dietary_alignment: 0.8,
    values_alignment: 0.75,
    age_compatibility: 0.6,
    location_proximity: 0.5
  },
  
  compatibilityWeights: {
    age_difference: -0.05,
    location_distance: -0.002,
    dietary_type_match: 0.3,
    values_alignment: 0.4
  }
};

// Online learning configuration
const onlineLearningConfig = {
  learningRate: 0.001,
  batchSize: 32,
  updateThreshold: 100  // Minimum interactions before update
};
```

## Integration with Planted App

### Database Integration

The framework integrates with the existing Planted database schema:

```javascript
// User model integration
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');

// Extract features from database
const user = await User.findById(userId)
  .populate('matches')
  .populate('messages');

const features = UserFeatureExtractor.extractAllFeatures(user);
```

### API Integration

```javascript
// Express.js route integration
app.post('/api/compatibility/predict', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;
    
    const compatibility = await framework.predictCompatibility(user1Id, user2Id, {
      personalized: true,
      includeTemporal: true
    });
    
    res.json(compatibility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Real-time Processing

```javascript
// Socket.io integration for real-time learning
io.on('connection', (socket) => {
  socket.on('user_interaction', async (interaction) => {
    // Process interaction for online learning
    await framework.learning.online.processInteraction({
      userId: socket.userId,
      ...interaction,
      timestamp: new Date()
    });
  });
});
```

## Monitoring and Alerting

### Dashboard Integration

```javascript
// Real-time dashboard data
app.get('/api/admin/dashboard/data-science', async (req, res) => {
  const dashboardData = await framework.getDashboardData();
  res.json(dashboardData);
});
```

### Alerting System

```javascript
// Set up alerting for critical issues
framework.learning.anomalyDetection.on('criticalAnomalies', (anomalies) => {
  // Send alerts to operations team
  sendSlackAlert(`Critical anomalies detected: ${anomalies.length}`);
  
  // Log to monitoring system
  logger.error('Critical anomalies detected', { anomalies });
});

framework.analytics.algorithm.on('metricsUpdated', (metrics) => {
  // Check for performance degradation
  if (metrics.precision.precision_at_10 < 0.15) {
    sendAlert('Algorithm precision below threshold');
  }
});
```

## Best Practices

### Data Quality
- Ensure user profile completeness before feature extraction
- Validate interaction data for consistency and accuracy
- Handle missing data appropriately in feature engineering
- Regular data quality audits and cleaning

### Model Management
- Version control for all models and configurations
- A/B test all significant algorithm changes
- Monitor model performance continuously
- Implement gradual rollouts for model updates

### Fairness and Ethics
- Regular bias audits across all demographic groups
- Monitor for disparate impact in matching outcomes
- Ensure individual privacy in feature engineering
- Transparent algorithm explanations for users

### Performance Optimization
- Cache frequently accessed features
- Batch process when possible for efficiency
- Monitor prediction latency and optimize bottlenecks
- Use appropriate data structures for large-scale operations

## Dependencies

```json
{
  "@tensorflow/tfjs-node": "^4.10.0",
  "mongoose": "^7.5.0",
  "lodash": "^4.17.21",
  "moment": "^2.29.4",
  "uuid": "^9.0.0"
}
```

## Testing

### Unit Tests
```bash
npm test -- --grep "DataScienceFramework"
```

### Integration Tests
```bash
npm run test:integration -- data-science
```

### Performance Tests
```bash
npm run test:performance -- compatibility-prediction
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/data-science-improvement`)
3. Make your changes with comprehensive tests
4. Ensure all tests pass and performance benchmarks are met
5. Submit a pull request with detailed description

## License

This data science framework is part of the Planted dating app and is proprietary software. Unauthorized distribution is prohibited.

## Support

For questions about the data science framework:
- Technical issues: Contact the data science team
- Performance concerns: Check the monitoring dashboard
- Feature requests: Submit through the product team
- Bug reports: Use the internal issue tracking system

---

**Note**: This framework is designed specifically for the Planted plant-based dating app and includes domain-specific optimizations for plant-based lifestyle compatibility prediction. While the techniques are generalizable, the feature engineering and model parameters are tailored for this specific use case.