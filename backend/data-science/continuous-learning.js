/**
 * PLANTED MATCHING ALGORITHM - CONTINUOUS LEARNING PIPELINE
 * 
 * Online learning, batch retraining, feature importance analysis,
 * and anomaly detection for continuous algorithm improvement.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const EventEmitter = require('events');
const tf = require('@tensorflow/tfjs-node');

/**
 * ONLINE LEARNING SYSTEM
 * Real-time model updates from user interactions
 */
class OnlineLearningSystem extends EventEmitter {
  
  constructor() {
    super();
    this.learningRate = 0.001;
    this.batchSize = 32;
    this.updateThreshold = 100; // Minimum interactions before update
    this.interactionBuffer = [];
    this.modelVersion = 1;
    this.lastUpdateTime = new Date();
  }
  
  /**
   * Process real-time user interaction for online learning
   */
  async processInteraction(interaction) {
    // Add interaction to buffer
    this.interactionBuffer.push({
      ...interaction,
      timestamp: new Date(),
      processed: false
    });
    
    // Check if we should trigger an online update
    if (this.shouldTriggerUpdate()) {
      await this.performOnlineUpdate();
    }
    
    // Emit interaction event
    this.emit('interactionProcessed', interaction);
  }
  
  /**
   * Determine if online update should be triggered
   */
  shouldTriggerUpdate() {
    const unprocessedInteractions = this.interactionBuffer.filter(i => !i.processed);
    
    return (
      unprocessedInteractions.length >= this.updateThreshold ||
      this.getTimeSinceLastUpdate() > 3600000 || // 1 hour
      this.detectConceptDrift(unprocessedInteractions)
    );
  }
  
  /**
   * Perform online learning update
   */
  async performOnlineUpdate() {
    console.log('Performing online learning update...');
    
    const unprocessedInteractions = this.interactionBuffer.filter(i => !i.processed);
    
    if (unprocessedInteractions.length === 0) return;
    
    try {
      // Prepare training data from recent interactions
      const trainingData = await this.prepareOnlineTrainingData(unprocessedInteractions);
      
      // Update model weights using stochastic gradient descent
      await this.updateModelWeights(trainingData);
      
      // Mark interactions as processed
      unprocessedInteractions.forEach(interaction => {
        interaction.processed = true;
      });
      
      // Update metadata
      this.lastUpdateTime = new Date();
      this.modelVersion++;
      
      // Clean up old interactions
      this.cleanupInteractionBuffer();
      
      console.log(`Online update completed. Model version: ${this.modelVersion}`);
      this.emit('modelUpdated', {
        version: this.modelVersion,
        interactionsProcessed: unprocessedInteractions.length,
        updateType: 'online'
      });
      
    } catch (error) {
      console.error('Online learning update failed:', error);
      this.emit('updateError', error);
    }
  }
  
  /**
   * Prepare training data from interactions
   */
  async prepareOnlineTrainingData(interactions) {
    const trainingExamples = [];
    
    for (const interaction of interactions) {
      // Extract features from interaction context
      const features = await this.extractInteractionFeatures(interaction);
      
      // Determine label based on interaction type
      const label = this.extractInteractionLabel(interaction);
      
      if (features && label !== null) {
        trainingExamples.push({ features, label, weight: this.calculateImportanceWeight(interaction) });
      }
    }
    
    return trainingExamples;
  }
  
  /**
   * Extract features from interaction context
   */
  async extractInteractionFeatures(interaction) {
    // This would integrate with the feature engineering system
    return {
      user_features: interaction.userFeatures || [],
      target_features: interaction.targetFeatures || [],
      context_features: this.extractContextFeatures(interaction),
      compatibility_score: interaction.predictedCompatibility || 0.5,
      interaction_time: this.normalizeTime(interaction.timestamp),
      session_context: interaction.sessionContext || {}
    };
  }
  
  /**
   * Extract label from interaction outcome
   */
  extractInteractionLabel(interaction) {
    switch (interaction.type) {
      case 'swipe_like':
        return 1;
      case 'swipe_pass':
        return 0;
      case 'super_like':
        return 2;
      case 'match':
        return 3;
      case 'message_sent':
        return 4;
      case 'date_planned':
        return 5;
      case 'unmatch':
        return -1;
      default:
        return null;
    }
  }
  
  /**
   * Calculate importance weight for interaction
   */
  calculateImportanceWeight(interaction) {
    let weight = 1.0;
    
    // Recent interactions are more important
    const ageInHours = (Date.now() - new Date(interaction.timestamp)) / (1000 * 60 * 60);
    weight *= Math.exp(-ageInHours / 24); // Exponential decay over 24 hours
    
    // High-value interactions get higher weight
    const interactionValues = {
      'date_planned': 5.0,
      'message_sent': 3.0,
      'match': 2.5,
      'super_like': 2.0,
      'swipe_like': 1.0,
      'swipe_pass': 0.8,
      'unmatch': 2.0 // High weight for negative feedback
    };
    
    weight *= interactionValues[interaction.type] || 1.0;
    
    // Active users get higher weight
    if (interaction.userEngagementScore > 0.7) {
      weight *= 1.5;
    }
    
    return Math.min(weight, 10.0); // Cap at 10x
  }
  
  /**
   * Update model weights using gradient descent
   */
  async updateModelWeights(trainingData) {
    if (trainingData.length === 0) return;
    
    // Create batches for mini-batch gradient descent
    const batches = this.createBatches(trainingData, this.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }
  
  /**
   * Process a single batch for weight updates
   */
  async processBatch(batch) {
    // Prepare batch tensors
    const batchFeatures = batch.map(example => Object.values(example.features.user_features).concat(
      Object.values(example.features.target_features),
      [example.features.compatibility_score],
      [example.features.interaction_time]
    ).filter(f => typeof f === 'number'));
    
    const batchLabels = batch.map(example => example.label);
    const batchWeights = batch.map(example => example.weight);
    
    if (batchFeatures.length === 0 || batchFeatures[0].length === 0) return;
    
    const featureTensor = tf.tensor2d(batchFeatures);
    const labelTensor = tf.tensor1d(batchLabels);
    const weightTensor = tf.tensor1d(batchWeights);
    
    try {
      // Perform gradient descent step
      await this.gradientDescentStep(featureTensor, labelTensor, weightTensor);
    } finally {
      // Clean up tensors
      featureTensor.dispose();
      labelTensor.dispose();
      weightTensor.dispose();
    }
  }
  
  /**
   * Perform single gradient descent step
   */
  async gradientDescentStep(features, labels, weights) {
    // This would integrate with the actual model
    // Placeholder implementation
    
    // Calculate predictions
    const predictions = await this.predict(features);
    
    // Calculate weighted loss gradient
    const loss = this.calculateWeightedLoss(predictions, labels, weights);
    
    // Update weights based on gradient
    // This would update the actual model parameters
    console.log(`Batch loss: ${await loss.data()}`);
    
    predictions.dispose();
    loss.dispose();
  }
  
  /**
   * Detect concept drift in interaction patterns
   */
  detectConceptDrift(recentInteractions) {
    if (recentInteractions.length < 50) return false;
    
    // Compare recent interaction patterns with historical baseline
    const recentPatterns = this.analyzeInteractionPatterns(recentInteractions);
    const historicalPatterns = this.getHistoricalPatterns();
    
    if (!historicalPatterns) return false;
    
    // Calculate distribution distance (simplified KL divergence)
    const drift = this.calculateDistributionDistance(recentPatterns, historicalPatterns);
    
    // Drift threshold
    return drift > 0.2; // 20% threshold
  }
  
  /**
   * Clean up old interactions from buffer
   */
  cleanupInteractionBuffer() {
    const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoffTime = Date.now() - retentionPeriod;
    
    this.interactionBuffer = this.interactionBuffer.filter(
      interaction => new Date(interaction.timestamp) > cutoffTime
    );
  }
  
  getTimeSinceLastUpdate() {
    return Date.now() - this.lastUpdateTime.getTime();
  }
}

/**
 * BATCH RETRAINING SYSTEM
 * Periodic full model retraining with comprehensive data
 */
class BatchRetrainingSystem extends EventEmitter {
  
  constructor() {
    super();
    this.retrainingSchedule = {
      daily: true,
      weekly: true,
      monthly: true
    };
    this.lastRetraining = {
      daily: null,
      weekly: null,
      monthly: null
    };
    this.retrainingInProgress = false;
  }
  
  /**
   * Schedule and execute batch retraining
   */
  async scheduleRetraining() {
    console.log('Checking retraining schedule...');
    
    const now = new Date();
    
    // Check if any retraining is due
    if (this.isDailyRetrainingDue(now)) {
      await this.performBatchRetraining('daily');
    }
    
    if (this.isWeeklyRetrainingDue(now)) {
      await this.performBatchRetraining('weekly');
    }
    
    if (this.isMonthlyRetrainingDue(now)) {
      await this.performBatchRetraining('monthly');
    }
  }
  
  /**
   * Perform batch retraining
   */
  async performBatchRetraining(retrainingType) {
    if (this.retrainingInProgress) {
      console.log('Retraining already in progress, skipping...');
      return;
    }
    
    this.retrainingInProgress = true;
    
    try {
      console.log(`Starting ${retrainingType} batch retraining...`);
      this.emit('retrainingStarted', { type: retrainingType });
      
      // Load training data based on retraining type
      const trainingData = await this.loadTrainingData(retrainingType);
      
      // Perform feature engineering
      const engineeredFeatures = await this.performFeatureEngineering(trainingData);
      
      // Train new model
      const newModel = await this.trainNewModel(engineeredFeatures);
      
      // Validate new model
      const validationResults = await this.validateNewModel(newModel, trainingData);
      
      // Deploy if validation passes
      if (validationResults.shouldDeploy) {
        await this.deployNewModel(newModel, validationResults);
        this.lastRetraining[retrainingType] = new Date();
        
        console.log(`${retrainingType} retraining completed successfully`);
        this.emit('retrainingCompleted', {
          type: retrainingType,
          results: validationResults,
          modelVersion: newModel.version
        });
      } else {
        console.log(`${retrainingType} retraining validation failed, keeping current model`);
        this.emit('retrainingFailed', {
          type: retrainingType,
          reason: validationResults.failureReason
        });
      }
      
    } catch (error) {
      console.error(`${retrainingType} retraining failed:`, error);
      this.emit('retrainingError', { type: retrainingType, error });
    } finally {
      this.retrainingInProgress = false;
    }
  }
  
  /**
   * Load training data for retraining
   */
  async loadTrainingData(retrainingType) {
    const timeWindow = this.getTimeWindow(retrainingType);
    
    // This would integrate with the data pipeline
    return {
      interactions: await this.loadInteractionData(timeWindow),
      userProfiles: await this.loadUserProfileData(timeWindow),
      outcomes: await this.loadOutcomeData(timeWindow),
      feedback: await this.loadFeedbackData(timeWindow)
    };
  }
  
  /**
   * Perform comprehensive feature engineering
   */
  async performFeatureEngineering(trainingData) {
    console.log('Performing feature engineering...');
    
    // Extract user features
    const userFeatures = await this.extractUserFeatures(trainingData.userProfiles);
    
    // Extract interaction features
    const interactionFeatures = await this.extractInteractionFeatures(trainingData.interactions);
    
    // Extract temporal features
    const temporalFeatures = await this.extractTemporalFeatures(trainingData);
    
    // Extract outcome features
    const outcomeFeatures = await this.extractOutcomeFeatures(trainingData.outcomes);
    
    // Combine all features
    return {
      userFeatures,
      interactionFeatures,
      temporalFeatures,
      outcomeFeatures,
      combinedFeatures: this.combineFeatures([
        userFeatures,
        interactionFeatures,
        temporalFeatures,
        outcomeFeatures
      ])
    };
  }
  
  /**
   * Train new model with engineered features
   */
  async trainNewModel(engineeredFeatures) {
    console.log('Training new model...');
    
    // Create model architecture
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [engineeredFeatures.combinedFeatures.featureCount],
          units: 128,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Compatibility score output
      ]
    });
    
    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    // Prepare training data
    const { X, y } = this.prepareModelTrainingData(engineeredFeatures);
    
    // Train model
    const history = await model.fit(X, y, {
      epochs: 100,
      batchSize: 64,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: [
        tf.callbacks.earlyStopping({ patience: 10, restoreBestWeights: true }),
        tf.callbacks.reduceLROnPlateau({ patience: 5, factor: 0.5 })
      ]
    });
    
    return {
      model,
      history: history.history,
      version: this.generateModelVersion(),
      trainingMetrics: this.extractTrainingMetrics(history)
    };
  }
  
  /**
   * Validate new model performance
   */
  async validateNewModel(newModel, trainingData) {
    console.log('Validating new model...');
    
    // Prepare validation data
    const validationData = await this.prepareValidationData(trainingData);
    
    // Calculate performance metrics
    const performanceMetrics = await this.calculateModelPerformance(newModel.model, validationData);
    
    // Compare with current model
    const currentModelMetrics = await this.getCurrentModelMetrics();
    const improvement = this.calculateImprovement(performanceMetrics, currentModelMetrics);
    
    // Check business metrics impact
    const businessImpact = await this.estimateBusinessImpact(newModel, validationData);
    
    // Make deployment decision
    const shouldDeploy = this.makeDeploymentDecision(improvement, businessImpact);
    
    return {
      shouldDeploy,
      performanceMetrics,
      improvement,
      businessImpact,
      validationPassed: shouldDeploy,
      failureReason: shouldDeploy ? null : this.getFailureReason(improvement, businessImpact)
    };
  }
  
  /**
   * Make deployment decision based on validation results
   */
  makeDeploymentDecision(improvement, businessImpact) {
    // Minimum improvement thresholds
    const thresholds = {
      accuracy: 0.02,      // 2% improvement
      precision: 0.03,     // 3% improvement
      recall: 0.02,        // 2% improvement
      businessMetric: 0.05 // 5% business improvement
    };
    
    // Check if improvements meet thresholds
    const accuracyImproved = improvement.accuracy >= thresholds.accuracy;
    const precisionImproved = improvement.precision >= thresholds.precision;
    const recallImproved = improvement.recall >= thresholds.recall;
    const businessImproved = businessImpact.estimatedImprovement >= thresholds.businessMetric;
    
    // Deploy if significant improvement in any key metric
    return accuracyImproved || precisionImproved || recallImproved || businessImproved;
  }
  
  /**
   * Deploy new model to production
   */
  async deployNewModel(newModel, validationResults) {
    console.log('Deploying new model to production...');
    
    // Save model
    const modelPath = await this.saveModel(newModel);
    
    // Update model registry
    await this.updateModelRegistry(newModel, validationResults, modelPath);
    
    // Gradual rollout (A/B test)
    await this.initiateGradualRollout(newModel, 0.1); // Start with 10% traffic
    
    // Monitor deployment
    this.monitorDeployment(newModel);
    
    console.log('Model deployment initiated');
  }
  
  /**
   * Helper methods
   */
  
  isDailyRetrainingDue(now) {
    if (!this.retrainingSchedule.daily) return false;
    if (!this.lastRetraining.daily) return true;
    
    const daysSinceLastRetraining = (now - this.lastRetraining.daily) / (1000 * 60 * 60 * 24);
    return daysSinceLastRetraining >= 1;
  }
  
  isWeeklyRetrainingDue(now) {
    if (!this.retrainingSchedule.weekly) return false;
    if (!this.lastRetraining.weekly) return true;
    
    const daysSinceLastRetraining = (now - this.lastRetraining.weekly) / (1000 * 60 * 60 * 24);
    return daysSinceLastRetraining >= 7;
  }
  
  isMonthlyRetrainingDue(now) {
    if (!this.retrainingSchedule.monthly) return false;
    if (!this.lastRetraining.monthly) return true;
    
    const daysSinceLastRetraining = (now - this.lastRetraining.monthly) / (1000 * 60 * 60 * 24);
    return daysSinceLastRetraining >= 30;
  }
  
  getTimeWindow(retrainingType) {
    const timeWindows = {
      daily: 7,    // 7 days of data
      weekly: 30,  // 30 days of data
      monthly: 90  // 90 days of data
    };
    
    return timeWindows[retrainingType] || 30;
  }
  
  generateModelVersion() {
    return `v${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * FEATURE IMPORTANCE ANALYZER
 * Analyzes which features drive successful matches
 */
class FeatureImportanceAnalyzer extends EventEmitter {
  
  constructor() {
    super();
    this.featureImportanceScores = {};
    this.importanceHistory = [];
  }
  
  /**
   * Analyze feature importance using multiple techniques
   */
  async analyzeFeatureImportance(model, trainingData) {
    console.log('Analyzing feature importance...');
    
    const importanceResults = {
      timestamp: new Date(),
      
      // Permutation importance
      permutationImportance: await this.calculatePermutationImportance(model, trainingData),
      
      // SHAP values
      shapValues: await this.calculateSHAPValues(model, trainingData),
      
      // Correlation analysis
      correlationAnalysis: await this.performCorrelationAnalysis(trainingData),
      
      // Mutual information
      mutualInformation: await this.calculateMutualInformation(trainingData),
      
      // Feature stability over time
      temporalStability: await this.analyzeTemporalStability(trainingData)
    };
    
    // Combine different importance measures
    const combinedImportance = this.combineImportanceMeasures(importanceResults);
    
    // Update importance scores
    this.featureImportanceScores = combinedImportance;
    this.importanceHistory.push(importanceResults);
    
    this.emit('importanceAnalyzed', importanceResults);
    
    return importanceResults;
  }
  
  /**
   * Calculate permutation importance
   */
  async calculatePermutationImportance(model, trainingData) {
    const baselinePerformance = await this.evaluateModel(model, trainingData);
    const importanceScores = {};
    
    // Get feature names
    const featureNames = Object.keys(trainingData.features[0] || {});
    
    for (const featureName of featureNames) {
      // Create permuted dataset
      const permutedData = this.permuteFeature(trainingData, featureName);
      
      // Evaluate model on permuted data
      const permutedPerformance = await this.evaluateModel(model, permutedData);
      
      // Calculate importance as performance drop
      importanceScores[featureName] = baselinePerformance.accuracy - permutedPerformance.accuracy;
    }
    
    return this.normalizeImportanceScores(importanceScores);
  }
  
  /**
   * Generate feature importance insights
   */
  generateImportanceInsights() {
    const importance = this.featureImportanceScores;
    
    if (!importance || Object.keys(importance).length === 0) {
      return { error: 'No feature importance data available' };
    }
    
    // Sort features by importance
    const sortedFeatures = Object.entries(importance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 features
    
    // Categorize features
    const categories = this.categorizeFeatures(sortedFeatures);
    
    // Generate insights
    const insights = {
      timestamp: new Date(),
      
      top_features: sortedFeatures.slice(0, 10),
      
      feature_categories: categories,
      
      key_insights: this.generateKeyInsights(sortedFeatures, categories),
      
      recommendations: this.generateFeatureRecommendations(sortedFeatures, categories),
      
      temporal_trends: this.analyzeImportanceTrends()
    };
    
    return insights;
  }
  
  /**
   * Categorize features by type
   */
  categorizeFeatures(sortedFeatures) {
    const categories = {
      demographic: [],
      dietary_journey: [],
      values_lifestyle: [],
      behavioral: [],
      temporal: [],
      interaction: []
    };
    
    sortedFeatures.forEach(([featureName, importance]) => {
      if (featureName.includes('age') || featureName.includes('gender') || featureName.includes('location')) {
        categories.demographic.push({ feature: featureName, importance });
      } else if (featureName.includes('dietary') || featureName.includes('years_based') || featureName.includes('motivation')) {
        categories.dietary_journey.push({ feature: featureName, importance });
      } else if (featureName.includes('values') || featureName.includes('interest') || featureName.includes('lifestyle')) {
        categories.values_lifestyle.push({ feature: featureName, importance });
      } else if (featureName.includes('behavior') || featureName.includes('response') || featureName.includes('activity')) {
        categories.behavioral.push({ feature: featureName, importance });
      } else if (featureName.includes('time') || featureName.includes('temporal') || featureName.includes('seasonal')) {
        categories.temporal.push({ feature: featureName, importance });
      } else {
        categories.interaction.push({ feature: featureName, importance });
      }
    });
    
    return categories;
  }
  
  /**
   * Generate key insights from feature importance
   */
  generateKeyInsights(sortedFeatures, categories) {
    const insights = [];
    
    // Top feature insight
    if (sortedFeatures.length > 0) {
      const topFeature = sortedFeatures[0];
      insights.push({
        type: 'top_feature',
        message: `"${topFeature[0]}" is the most important feature with ${(topFeature[1] * 100).toFixed(1)}% importance`,
        importance: 'high'
      });
    }
    
    // Category dominance
    const categoryImportance = {};
    Object.entries(categories).forEach(([category, features]) => {
      categoryImportance[category] = features.reduce((sum, f) => sum + f.importance, 0);
    });
    
    const dominantCategory = Object.entries(categoryImportance)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantCategory) {
      insights.push({
        type: 'category_dominance',
        message: `${dominantCategory[0].replace('_', ' ')} features are most influential for matching success`,
        importance: 'high'
      });
    }
    
    // Behavioral vs static features
    const behavioralImportance = categoryImportance.behavioral || 0;
    const staticImportance = (categoryImportance.demographic || 0) + (categoryImportance.dietary_journey || 0);
    
    if (behavioralImportance > staticImportance) {
      insights.push({
        type: 'behavioral_dominance',
        message: 'Behavioral features are more predictive than static profile features',
        importance: 'medium'
      });
    }
    
    return insights;
  }
}

/**
 * ANOMALY DETECTION SYSTEM
 * Identifies unusual patterns or potential issues in the matching system
 */
class AnomalyDetectionSystem extends EventEmitter {
  
  constructor() {
    super();
    this.anomalyThresholds = this.initializeThresholds();
    this.detectedAnomalies = [];
    this.baselineMetrics = {};
  }
  
  /**
   * Initialize anomaly detection thresholds
   */
  initializeThresholds() {
    return {
      match_rate_deviation: 0.3,     // 30% deviation from baseline
      response_time_spike: 2.0,      // 2x normal response time
      user_activity_drop: 0.5,      // 50% drop in activity
      conversion_rate_drop: 0.4,    // 40% drop in conversion
      error_rate_spike: 0.05,       // 5% error rate threshold
      bias_metric_violation: 0.1    // 10% bias threshold
    };
  }
  
  /**
   * Detect anomalies in system metrics
   */
  async detectAnomalies(currentMetrics, historicalData) {
    console.log('Running anomaly detection...');
    
    const anomalies = [];
    
    // Statistical anomaly detection
    const statisticalAnomalies = await this.detectStatisticalAnomalies(currentMetrics, historicalData);
    anomalies.push(...statisticalAnomalies);
    
    // Business metric anomalies
    const businessAnomalies = await this.detectBusinessMetricAnomalies(currentMetrics);
    anomalies.push(...businessAnomalies);
    
    // Bias and fairness anomalies
    const biasAnomalies = await this.detectBiasAnomalies(currentMetrics);
    anomalies.push(...biasAnomalies);
    
    // Performance anomalies
    const performanceAnomalies = await this.detectPerformanceAnomalies(currentMetrics);
    anomalies.push(...performanceAnomalies);
    
    // Update anomaly history
    this.detectedAnomalies.push({
      timestamp: new Date(),
      anomalies,
      metrics: currentMetrics
    });
    
    // Emit alerts for high-severity anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      this.emit('criticalAnomalies', criticalAnomalies);
    }
    
    return {
      timestamp: new Date(),
      totalAnomalies: anomalies.length,
      anomaliesBySeverity: this.groupBySeverity(anomalies),
      anomalies,
      recommendations: this.generateAnomalyRecommendations(anomalies)
    };
  }
  
  /**
   * Detect statistical anomalies using z-score and isolation forest
   */
  async detectStatisticalAnomalies(currentMetrics, historicalData) {
    const anomalies = [];
    
    // Z-score based detection
    const zScoreAnomalies = this.detectZScoreAnomalies(currentMetrics, historicalData);
    anomalies.push(...zScoreAnomalies);
    
    // Isolation forest for multivariate anomalies
    const isolationAnomalies = await this.detectIsolationAnomalies(currentMetrics, historicalData);
    anomalies.push(...isolationAnomalies);
    
    return anomalies;
  }
  
  /**
   * Detect anomalies using z-score method
   */
  detectZScoreAnomalies(currentMetrics, historicalData) {
    const anomalies = [];
    const threshold = 2.5; // Z-score threshold
    
    // Define metrics to monitor
    const metricsToMonitor = [
      'match_rate',
      'response_rate',
      'conversation_rate',
      'user_activity_rate',
      'average_session_duration'
    ];
    
    metricsToMonitor.forEach(metricName => {
      if (currentMetrics[metricName] !== undefined && historicalData[metricName]) {
        const historical = historicalData[metricName];
        const current = currentMetrics[metricName];
        
        const mean = this.calculateMean(historical);
        const std = this.calculateStandardDeviation(historical);
        
        if (std > 0) {
          const zScore = Math.abs((current - mean) / std);
          
          if (zScore > threshold) {
            anomalies.push({
              type: 'statistical',
              metric: metricName,
              current_value: current,
              historical_mean: mean,
              z_score: zScore,
              severity: zScore > 3 ? 'critical' : 'warning',
              description: `${metricName} deviates significantly from historical pattern`,
              timestamp: new Date()
            });
          }
        }
      }
    });
    
    return anomalies;
  }
  
  /**
   * Generate anomaly detection report
   */
  generateAnomalyReport() {
    const recentAnomalies = this.detectedAnomalies.slice(-10); // Last 10 detection runs
    
    if (recentAnomalies.length === 0) {
      return { message: 'No anomaly detection data available' };
    }
    
    const allAnomalies = recentAnomalies.flatMap(detection => detection.anomalies);
    
    return {
      timestamp: new Date(),
      
      summary: {
        total_anomalies: allAnomalies.length,
        critical_anomalies: allAnomalies.filter(a => a.severity === 'critical').length,
        most_common_type: this.getMostCommonAnomalyType(allAnomalies),
        detection_runs: recentAnomalies.length
      },
      
      recent_anomalies: allAnomalies.slice(-20), // Last 20 anomalies
      
      anomaly_trends: this.analyzeAnomalyTrends(recentAnomalies),
      
      system_health: this.assessSystemHealth(allAnomalies),
      
      recommendations: this.generateSystemRecommendations(allAnomalies)
    };
  }
  
  /**
   * Helper methods
   */
  
  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  calculateStandardDeviation(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  groupBySeverity(anomalies) {
    return anomalies.reduce((groups, anomaly) => {
      const severity = anomaly.severity || 'warning';
      if (!groups[severity]) groups[severity] = 0;
      groups[severity]++;
      return groups;
    }, {});
  }
  
  getMostCommonAnomalyType(anomalies) {
    const typeCounts = anomalies.reduce((counts, anomaly) => {
      const type = anomaly.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
  }
  
  assessSystemHealth(anomalies) {
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;
    
    if (criticalCount > 5) return 'critical';
    if (criticalCount > 0 || warningCount > 10) return 'warning';
    if (warningCount > 0) return 'healthy_with_issues';
    return 'healthy';
  }
}

module.exports = {
  OnlineLearningSystem,
  BatchRetrainingSystem,
  FeatureImportanceAnalyzer,
  AnomalyDetectionSystem
};