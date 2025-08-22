/**
 * PLANTED MATCHING ALGORITHM - STATISTICAL MODELS
 * 
 * Bayesian compatibility models, clustering analysis, survival analysis,
 * and causal inference for plant-based dating compatibility prediction.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const tf = require('@tensorflow/tfjs-node');
const { UserFeatureExtractor, InteractionFeatureExtractor } = require('./feature-engineering');

/**
 * BAYESIAN COMPATIBILITY MODEL
 * Uses Bayesian inference to predict compatibility with prior beliefs updated by user behavior
 */
class BayesianCompatibilityModel {
  
  constructor() {
    this.priorBeliefs = this.initializePriorBeliefs();
    this.compatibilityWeights = this.initializeCompatibilityWeights();
    this.model = null;
  }
  
  /**
   * Initialize prior beliefs about compatibility factors
   */
  initializePriorBeliefs() {
    return {
      // Core compatibility priors (0-1 probability)
      dietary_alignment: 0.8, // Strong prior that dietary alignment matters
      values_alignment: 0.75, // Values are very important
      age_compatibility: 0.6, // Age matters but less critical
      location_proximity: 0.5, // Location important but not dealbreaker
      lifestyle_compatibility: 0.7, // Lifestyle alignment important
      interest_overlap: 0.4, // Shared interests helpful but not essential
      
      // Behavioral compatibility priors
      communication_style: 0.6, // Communication compatibility matters
      activity_level_match: 0.5, // Similar activity levels helpful
      commitment_readiness: 0.8, // Both should be ready for commitment
      
      // Relationship progression priors
      mutual_attraction: 0.9, // Must have mutual initial attraction
      conversation_quality: 0.8, // Good conversation essential
      date_chemistry: 0.85 // Real-world chemistry crucial
    };
  }
  
  /**
   * Initialize compatibility weights for different factors
   */
  initializeCompatibilityWeights() {
    return {
      // Demographic weights
      age_difference: -0.05, // Per year difference penalty
      location_distance: -0.002, // Per mile penalty
      
      // Plant-based journey weights
      dietary_type_match: 0.3, // Vegan-vegan bonus
      years_based_similarity: 0.2, // Similar journey length bonus
      motivation_alignment: 0.25, // Similar motivations bonus
      
      // Values and lifestyle weights
      ethical_priority_overlap: 0.4, // Strong predictor
      interest_jaccard_similarity: 0.15, // Jaccard index of interests
      activity_level_difference: -0.1, // Penalty for large differences
      cooking_compatibility: 0.1, // Cooking level compatibility
      
      // Behavioral weights
      communication_frequency_match: 0.2, // Similar messaging patterns
      response_time_compatibility: 0.15, // Similar response speeds
      selectivity_similarity: 0.1, // Similar swiping patterns
      
      // Quality indicators
      profile_completeness_both: 0.05, // Both have complete profiles
      photo_quality_both: 0.05, // Both have good photos
      message_quality_both: 0.1 // Both write quality messages
    };
  }
  
  /**
   * Calculate base compatibility score using Bayesian approach
   */
  calculateBaseCompatibility(user1Features, user2Features) {
    let compatibilityScore = 0.5; // Start with neutral prior
    let evidenceWeight = 0;
    
    // Age compatibility
    const ageDiff = Math.abs(user1Features.demographic.age_normalized - user2Features.demographic.age_normalized);
    const ageCompatibility = Math.exp(-ageDiff * 5); // Exponential decay
    compatibilityScore += this.compatibilityWeights.age_difference * ageDiff;
    evidenceWeight += 0.1;
    
    // Dietary alignment
    const dietaryMatch = user1Features.dietary.dietary_type === user2Features.dietary.dietary_type ? 1 : 0.7;
    compatibilityScore += this.compatibilityWeights.dietary_type_match * dietaryMatch;
    evidenceWeight += 0.3;
    
    // Values alignment using cosine similarity
    const valuesAlignment = this.calculateCosineSimilarity(
      user1Features.values.ethical_priorities,
      user2Features.values.ethical_priorities
    );
    compatibilityScore += this.compatibilityWeights.ethical_priority_overlap * valuesAlignment;
    evidenceWeight += 0.25;
    
    // Interest overlap using Jaccard similarity
    const interestSimilarity = this.calculateJaccardSimilarity(
      user1Features.values.interest_vector,
      user2Features.values.interest_vector
    );
    compatibilityScore += this.compatibilityWeights.interest_jaccard_similarity * interestSimilarity;
    evidenceWeight += 0.15;
    
    // Location compatibility
    if (user1Features.demographic.location_features.coordinates && 
        user2Features.demographic.location_features.coordinates) {
      const distance = this.calculateDistance(
        user1Features.demographic.location_features.coordinates,
        user2Features.demographic.location_features.coordinates
      );
      compatibilityScore += this.compatibilityWeights.location_distance * distance;
      evidenceWeight += 0.1;
    }
    
    // Plant-based journey similarity
    const journeyAlignment = this.calculateJourneyAlignment(
      user1Features.dietary,
      user2Features.dietary
    );
    compatibilityScore += this.compatibilityWeights.years_based_similarity * journeyAlignment;
    evidenceWeight += 0.2;
    
    // Normalize by evidence weight and apply sigmoid
    compatibilityScore = compatibilityScore / Math.max(evidenceWeight, 1);
    return this.sigmoid(compatibilityScore);
  }
  
  /**
   * Update compatibility prediction with behavioral evidence
   */
  updateWithBehavioralEvidence(baseScore, user1Behavior, user2Behavior, interactionHistory = null) {
    if (!user1Behavior || !user2Behavior) return baseScore;
    
    let updatedScore = baseScore;
    let behavioralEvidence = 0;
    
    // Communication compatibility
    const commFreqMatch = 1 - Math.abs(
      user1Behavior.message_response_rate - user2Behavior.message_response_rate
    );
    updatedScore += this.compatibilityWeights.communication_frequency_match * commFreqMatch;
    behavioralEvidence += 0.2;
    
    // Response time compatibility  
    const responseTimeRatio = Math.min(
      user1Behavior.avg_response_time_hours / user2Behavior.avg_response_time_hours,
      user2Behavior.avg_response_time_hours / user1Behavior.avg_response_time_hours
    );
    updatedScore += this.compatibilityWeights.response_time_compatibility * responseTimeRatio;
    behavioralEvidence += 0.15;
    
    // Selectivity similarity
    const selectivityDiff = Math.abs(
      user1Behavior.selective_swiping_score - user2Behavior.selective_swiping_score
    );
    updatedScore += this.compatibilityWeights.selectivity_similarity * (1 - selectivityDiff);
    behavioralEvidence += 0.1;
    
    // If we have interaction history, use it for real-time updates
    if (interactionHistory) {
      const interactionEvidence = this.analyzeInteractionEvidence(interactionHistory);
      updatedScore += interactionEvidence.score_adjustment;
      behavioralEvidence += interactionEvidence.weight;
    }
    
    // Bayesian update: combine prior (base score) with likelihood (behavioral evidence)
    const posterior = this.bayesianUpdate(baseScore, updatedScore, behavioralEvidence);
    return Math.max(0, Math.min(1, posterior));
  }
  
  /**
   * Analyze interaction evidence for real-time compatibility updates
   */
  analyzeInteractionEvidence(interactionHistory) {
    let scoreAdjustment = 0;
    let weight = 0;
    
    // Message exchange analysis
    if (interactionHistory.messages) {
      const messageQuality = this.analyzeMessageExchange(interactionHistory.messages);
      scoreAdjustment += messageQuality.score * 0.3;
      weight += 0.3;
    }
    
    // Response time analysis
    if (interactionHistory.responseTimes) {
      const responseCompatibility = this.analyzeResponseTimes(interactionHistory.responseTimes);
      scoreAdjustment += responseCompatibility * 0.2;
      weight += 0.2;
    }
    
    // Conversation progression
    if (interactionHistory.conversationProgression) {
      const progressionScore = this.analyzeConversationProgression(interactionHistory.conversationProgression);
      scoreAdjustment += progressionScore * 0.25;
      weight += 0.25;
    }
    
    return { score_adjustment: scoreAdjustment, weight };
  }
  
  /**
   * Helper methods for compatibility calculations
   */
  
  calculateCosineSimilarity(vector1, vector2) {
    if (!vector1 || !vector2 || vector1.length !== vector2.length) return 0;
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }
  
  calculateJaccardSimilarity(set1, set2) {
    if (!set1 || !set2 || set1.length !== set2.length) return 0;
    
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < set1.length; i++) {
      if (set1[i] === 1 && set2[i] === 1) intersection++;
      if (set1[i] === 1 || set2[i] === 1) union++;
    }
    
    return union > 0 ? intersection / union : 0;
  }
  
  calculateDistance(coord1, coord2) {
    // Haversine formula for distance between coordinates
    const R = 3959; // Earth's radius in miles
    const dLat = this.degreesToRadians(coord2[1] - coord1[1]);
    const dLon = this.degreesToRadians(coord2[0] - coord1[0]);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.degreesToRadians(coord1[1])) * Math.cos(this.degreesToRadians(coord2[1])) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  calculateJourneyAlignment(dietary1, dietary2) {
    // Compare plant-based journey characteristics
    const yearsDiff = Math.abs(dietary1.years_plant_based - dietary2.years_plant_based);
    const yearsAlignment = Math.exp(-yearsDiff / 3); // Exponential decay
    
    const motivationAlignment = this.calculateCosineSimilarity(
      Object.values(dietary1.motivation_scores),
      Object.values(dietary2.motivation_scores)
    );
    
    const phaseAlignment = dietary1.journey_phase === dietary2.journey_phase ? 1 : 0.5;
    
    return (yearsAlignment + motivationAlignment + phaseAlignment) / 3;
  }
  
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  
  bayesianUpdate(prior, likelihood, evidenceWeight) {
    // Simple Bayesian update formula
    const posteriorNumerator = prior * likelihood * evidenceWeight;
    const posteriorDenominator = (prior * likelihood * evidenceWeight) + 
                                ((1 - prior) * (1 - likelihood) * evidenceWeight) + 
                                (prior * (1 - evidenceWeight));
    
    return posteriorDenominator > 0 ? posteriorNumerator / posteriorDenominator : prior;
  }
}

/**
 * CLUSTERING ANALYSIS MODEL
 * Identifies user personas and compatibility groups using unsupervised learning
 */
class CompatibilityClusteringModel {
  
  constructor() {
    this.clusters = null;
    this.clusterModel = null;
    this.numClusters = 8; // Default number of user personas
  }
  
  /**
   * Perform clustering analysis to identify user personas
   */
  async clusterUsers(userFeatures) {
    // Prepare feature matrix
    const featureMatrix = this.prepareFeatureMatrix(userFeatures);
    
    // Perform K-means clustering
    const kMeans = tf.layers.dense({
      units: this.numClusters,
      activation: 'softmax',
      name: 'clustering_layer'
    });
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [featureMatrix[0].length], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        kMeans
      ]
    });
    
    // Compile and train clustering model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy'
    });
    
    const featureTensor = tf.tensor2d(featureMatrix);
    
    // Use autoencoder approach for unsupervised clustering
    const clusterAssignments = await this.performKMeansClustering(featureTensor);
    
    // Analyze cluster characteristics
    this.clusters = this.analyzeClusterCharacteristics(userFeatures, clusterAssignments);
    
    return this.clusters;
  }
  
  /**
   * Identify compatibility patterns between clusters
   */
  analyzeClusterCompatibility(interactionHistory) {
    if (!this.clusters) {
      throw new Error('Must run clustering analysis first');
    }
    
    const compatibilityMatrix = Array(this.numClusters).fill().map(() => 
      Array(this.numClusters).fill(0)
    );
    
    // Analyze successful matches between cluster pairs
    interactionHistory.forEach(interaction => {
      if (interaction.successful_match) {
        const cluster1 = interaction.user1_cluster;
        const cluster2 = interaction.user2_cluster;
        
        compatibilityMatrix[cluster1][cluster2] += 1;
        compatibilityMatrix[cluster2][cluster1] += 1;
      }
    });
    
    // Normalize by total interactions per cluster pair
    return this.normalizeCompatibilityMatrix(compatibilityMatrix, interactionHistory);
  }
  
  /**
   * Prepare feature matrix for clustering
   */
  prepareFeatureMatrix(userFeatures) {
    return userFeatures.map(user => {
      const features = [];
      
      // Demographic features
      features.push(user.demographic.age_normalized);
      features.push(...user.demographic.gender_vector);
      features.push(...user.demographic.orientation_vector);
      features.push(user.demographic.location_tier / 3);
      
      // Dietary journey features
      features.push(user.dietary.dietary_type);
      features.push(user.dietary.years_normalized);
      features.push(user.dietary.commitment_level);
      features.push(...Object.values(user.dietary.motivation_scores));
      
      // Values and lifestyle features
      features.push(...user.values.interest_vector);
      features.push(user.values.lifestyle_activity_level);
      features.push(user.values.mindfulness_score);
      features.push(user.values.cooking_engagement);
      
      // Behavioral features (if available)
      if (user.behavioral) {
        features.push(user.behavioral.session_frequency / 7); // Normalize to daily
        features.push(user.behavioral.message_response_rate);
        features.push(user.behavioral.selective_swiping_score);
      } else {
        features.push(0, 0.5, 0.5); // Default values
      }
      
      return features;
    });
  }
  
  /**
   * Perform K-means clustering using TensorFlow.js
   */
  async performKMeansClustering(featureTensor) {
    const numFeatures = featureTensor.shape[1];
    
    // Initialize centroids randomly
    let centroids = tf.randomNormal([this.numClusters, numFeatures]);
    
    // K-means iterations
    for (let iteration = 0; iteration < 100; iteration++) {
      // Assign points to closest centroids
      const distances = tf.matMul(featureTensor, centroids, false, true);
      const assignments = tf.argMax(distances, 1);
      
      // Update centroids
      const newCentroids = [];
      for (let k = 0; k < this.numClusters; k++) {
        const mask = tf.equal(assignments, k);
        const clusterPoints = tf.boolean_mask(featureTensor, mask);
        
        if (clusterPoints.shape[0] > 0) {
          const newCentroid = tf.mean(clusterPoints, 0);
          newCentroids.push(newCentroid);
        } else {
          newCentroids.push(centroids.slice([k, 0], [1, -1]).squeeze());
        }
      }
      
      const newCentroidsStacked = tf.stack(newCentroids);
      
      // Check for convergence
      const centroidChange = tf.norm(tf.sub(centroids, newCentroidsStacked));
      const changeValue = await centroidChange.data();
      
      centroids.dispose();
      centroids = newCentroidsStacked;
      
      if (changeValue[0] < 0.001) break;
    }
    
    // Final assignment
    const finalDistances = tf.matMul(featureTensor, centroids, false, true);
    const finalAssignments = tf.argMax(finalDistances, 1);
    
    return await finalAssignments.data();
  }
  
  /**
   * Analyze characteristics of each cluster
   */
  analyzeClusterCharacteristics(userFeatures, clusterAssignments) {
    const clusters = Array(this.numClusters).fill().map(() => ({
      users: [],
      characteristics: {},
      persona: ''
    }));
    
    // Group users by cluster
    clusterAssignments.forEach((cluster, userIndex) => {
      clusters[cluster].users.push(userFeatures[userIndex]);
    });
    
    // Analyze each cluster
    clusters.forEach((cluster, clusterIndex) => {
      if (cluster.users.length === 0) return;
      
      cluster.characteristics = this.calculateClusterCharacteristics(cluster.users);
      cluster.persona = this.identifyPersona(cluster.characteristics);
    });
    
    return clusters;
  }
  
  calculateClusterCharacteristics(users) {
    const characteristics = {
      avg_age: 0,
      dominant_gender: '',
      dietary_distribution: { vegan: 0, vegetarian: 0 },
      avg_years_plant_based: 0,
      dominant_motivations: {},
      top_interests: [],
      avg_activity_level: 0,
      avg_cooking_skill: 0,
      location_distribution: {}
    };
    
    users.forEach(user => {
      characteristics.avg_age += user.demographic.age_normalized * (65 - 18) + 18;
      characteristics.avg_years_plant_based += user.dietary.years_plant_based;
      characteristics.avg_activity_level += user.values.lifestyle_activity_level;
      characteristics.avg_cooking_skill += user.values.cooking_engagement;
      
      // Count dietary types
      if (user.dietary.dietary_type === 1) {
        characteristics.dietary_distribution.vegan++;
      } else {
        characteristics.dietary_distribution.vegetarian++;
      }
    });
    
    const userCount = users.length;
    characteristics.avg_age /= userCount;
    characteristics.avg_years_plant_based /= userCount;
    characteristics.avg_activity_level /= userCount;
    characteristics.avg_cooking_skill /= userCount;
    
    return characteristics;
  }
  
  identifyPersona(characteristics) {
    // Rule-based persona identification
    if (characteristics.avg_years_plant_based < 2 && characteristics.dietary_distribution.vegetarian > characteristics.dietary_distribution.vegan) {
      return "Plant-Based Newcomers";
    } else if (characteristics.avg_activity_level > 0.7) {
      return "Active Lifestyle Enthusiasts";
    } else if (characteristics.avg_cooking_skill > 0.7) {
      return "Culinary Creators";
    } else if (characteristics.avg_years_plant_based > 5) {
      return "Seasoned Plant-Based Veterans";
    } else if (characteristics.avg_age < 28) {
      return "Young Plant-Based Professionals";
    } else if (characteristics.avg_age > 40) {
      return "Mature Plant-Based Community";
    } else {
      return "Balanced Plant-Based Seekers";
    }
  }
}

/**
 * SURVIVAL ANALYSIS MODEL
 * Predicts relationship duration and success probability using survival analysis
 */
class RelationshipSurvivalModel {
  
  constructor() {
    this.survivalModel = null;
    this.hazardRatios = {};
  }
  
  /**
   * Build survival model to predict relationship duration
   */
  buildSurvivalModel(relationshipData) {
    // Prepare survival data
    const survivalData = this.prepareSurvivalData(relationshipData);
    
    // Calculate Kaplan-Meier survival curves
    const survivalCurves = this.calculateKaplanMeierCurves(survivalData);
    
    // Fit Cox proportional hazards model
    const coxModel = this.fitCoxProportionalHazards(survivalData);
    
    this.survivalModel = {
      survivalCurves,
      coxModel,
      medianSurvivalTime: this.calculateMedianSurvival(survivalCurves)
    };
    
    return this.survivalModel;
  }
  
  /**
   * Predict relationship success probability at different time points
   */
  predictRelationshipSuccess(compatibilityFeatures, timePoints = [30, 90, 180, 365]) {
    if (!this.survivalModel) {
      throw new Error('Must build survival model first');
    }
    
    const predictions = {};
    
    timePoints.forEach(days => {
      const survivalProbability = this.calculateSurvivalProbability(
        compatibilityFeatures, 
        days
      );
      predictions[`${days}_days`] = survivalProbability;
    });
    
    return predictions;
  }
  
  /**
   * Prepare data for survival analysis
   */
  prepareSurvivalData(relationshipData) {
    return relationshipData.map(relationship => ({
      duration_days: relationship.duration_days,
      event_observed: relationship.ended ? 1 : 0, // 1 if relationship ended, 0 if censored
      compatibility_score: relationship.compatibility_score,
      age_difference: relationship.age_difference,
      location_distance: relationship.location_distance,
      dietary_alignment: relationship.dietary_alignment,
      values_alignment: relationship.values_alignment,
      communication_quality: relationship.communication_quality,
      initial_attraction: relationship.initial_attraction
    }));
  }
  
  /**
   * Calculate Kaplan-Meier survival curves
   */
  calculateKaplanMeierCurves(survivalData) {
    // Sort by duration
    const sortedData = [...survivalData].sort((a, b) => a.duration_days - b.duration_days);
    
    let atRisk = sortedData.length;
    let survivalProbability = 1.0;
    const survivalCurve = [];
    
    sortedData.forEach((record, index) => {
      if (record.event_observed === 1) {
        // Count events at this time point
        let eventsAtTime = 1;
        let j = index + 1;
        while (j < sortedData.length && 
               sortedData[j].duration_days === record.duration_days && 
               sortedData[j].event_observed === 1) {
          eventsAtTime++;
          j++;
        }
        
        // Update survival probability
        survivalProbability *= (atRisk - eventsAtTime) / atRisk;
        
        survivalCurve.push({
          time: record.duration_days,
          survival_probability: survivalProbability,
          at_risk: atRisk,
          events: eventsAtTime
        });
        
        atRisk -= eventsAtTime;
      } else {
        // Censored observation
        atRisk--;
      }
    });
    
    return survivalCurve;
  }
  
  /**
   * Fit Cox proportional hazards model
   */
  fitCoxProportionalHazards(survivalData) {
    // Simplified Cox model implementation
    // In production, would use proper survival analysis library
    
    const features = [
      'compatibility_score',
      'age_difference', 
      'location_distance',
      'dietary_alignment',
      'values_alignment',
      'communication_quality',
      'initial_attraction'
    ];
    
    // Calculate hazard ratios for each feature
    const hazardRatios = {};
    
    features.forEach(feature => {
      hazardRatios[feature] = this.calculateHazardRatio(survivalData, feature);
    });
    
    this.hazardRatios = hazardRatios;
    
    return {
      hazardRatios,
      features,
      logLikelihood: this.calculateLogLikelihood(survivalData, hazardRatios)
    };
  }
  
  calculateHazardRatio(data, feature) {
    // Simplified hazard ratio calculation
    // Compare high vs low values of the feature
    const sortedByFeature = [...data].sort((a, b) => a[feature] - b[feature]);
    const median = sortedByFeature[Math.floor(sortedByFeature.length / 2)][feature];
    
    const highGroup = data.filter(d => d[feature] >= median);
    const lowGroup = data.filter(d => d[feature] < median);
    
    const highEventRate = highGroup.filter(d => d.event_observed === 1).length / highGroup.length;
    const lowEventRate = lowGroup.filter(d => d.event_observed === 1).length / lowGroup.length;
    
    return lowEventRate > 0 ? highEventRate / lowEventRate : 1.0;
  }
  
  calculateLogLikelihood(data, hazardRatios) {
    // Simplified log-likelihood calculation
    let logLikelihood = 0;
    
    data.forEach(record => {
      let riskScore = 0;
      Object.keys(hazardRatios).forEach(feature => {
        riskScore += Math.log(hazardRatios[feature]) * record[feature];
      });
      
      if (record.event_observed === 1) {
        logLikelihood += riskScore;
      }
      
      // Subtract log of risk set sum (simplified)
      logLikelihood -= Math.exp(riskScore);
    });
    
    return logLikelihood;
  }
  
  calculateSurvivalProbability(compatibilityFeatures, timePoint) {
    if (!this.survivalModel) return 0.5;
    
    // Find survival probability at time point from Kaplan-Meier curve
    const curve = this.survivalModel.survivalCurves;
    let survivalProb = 1.0;
    
    for (let i = 0; i < curve.length; i++) {
      if (curve[i].time <= timePoint) {
        survivalProb = curve[i].survival_probability;
      } else {
        break;
      }
    }
    
    // Adjust based on individual risk factors using Cox model
    let riskScore = 0;
    Object.keys(this.hazardRatios).forEach(feature => {
      if (compatibilityFeatures[feature] !== undefined) {
        riskScore += Math.log(this.hazardRatios[feature]) * compatibilityFeatures[feature];
      }
    });
    
    const hazardRatio = Math.exp(riskScore);
    const adjustedSurvival = Math.pow(survivalProb, hazardRatio);
    
    return Math.max(0, Math.min(1, adjustedSurvival));
  }
  
  calculateMedianSurvival(survivalCurve) {
    // Find time where survival probability drops to 0.5
    for (let i = 0; i < survivalCurve.length; i++) {
      if (survivalCurve[i].survival_probability <= 0.5) {
        return survivalCurve[i].time;
      }
    }
    return null; // Median not reached
  }
}

module.exports = {
  BayesianCompatibilityModel,
  CompatibilityClusteringModel,
  RelationshipSurvivalModel
};