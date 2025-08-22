/**
 * PLANTED MATCHING ALGORITHM - PERSONALIZATION MODELS
 * 
 * Individual preference learning, temporal patterns, context awareness,
 * and feedback integration for personalized matching experiences.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const tf = require('@tensorflow/tfjs-node');

/**
 * INDIVIDUAL PREFERENCE LEARNING MODEL
 * Learns user-specific preferences and adjusts matching weights accordingly
 */
class IndividualPreferenceLearningModel {
  
  constructor() {
    this.userModels = new Map(); // User-specific models
    this.globalWeights = this.initializeGlobalWeights();
    this.learningRate = 0.01;
    this.adaptationThreshold = 10; // Minimum interactions before personalization
  }
  
  /**
   * Initialize global preference weights as baseline
   */
  initializeGlobalWeights() {
    return {
      // Demographic preferences
      age_importance: 0.15,
      location_importance: 0.10,
      education_importance: 0.05,
      
      // Plant-based journey preferences  
      dietary_alignment: 0.25,
      years_based_importance: 0.15,
      motivation_alignment: 0.20,
      
      // Lifestyle and values preferences
      interest_overlap: 0.10,
      activity_level_match: 0.08,
      cooking_compatibility: 0.07,
      values_alignment: 0.25,
      
      // Communication and behavior preferences
      communication_style: 0.12,
      response_time_preference: 0.05,
      message_quality_importance: 0.08,
      
      // Physical and attraction preferences
      photo_importance: 0.15,
      bio_quality_importance: 0.10,
      profile_completeness: 0.05
    };
  }
  
  /**
   * Learn individual user preferences from interaction history
   */
  async learnUserPreferences(userId, interactionHistory) {
    console.log(`Learning preferences for user ${userId}...`);
    
    if (interactionHistory.length < this.adaptationThreshold) {
      return this.globalWeights; // Use global weights for new users
    }
    
    // Extract preference signals from interactions
    const preferenceSignals = this.extractPreferenceSignals(interactionHistory);
    
    // Initialize or update user model
    if (!this.userModels.has(userId)) {
      this.userModels.set(userId, this.initializeUserModel(userId));
    }
    
    const userModel = this.userModels.get(userId);
    
    // Update preferences using gradient descent on user feedback
    const updatedWeights = await this.updatePreferenceWeights(
      userModel.weights,
      preferenceSignals,
      interactionHistory
    );
    
    // Calculate confidence scores for each preference
    const confidence = this.calculatePreferenceConfidence(preferenceSignals);
    
    userModel.weights = updatedWeights;
    userModel.confidence = confidence;
    userModel.lastUpdated = new Date();
    userModel.interactionCount = interactionHistory.length;
    
    this.userModels.set(userId, userModel);
    
    return updatedWeights;
  }
  
  /**
   * Extract preference signals from user interactions
   */
  extractPreferenceSignals(interactionHistory) {
    const signals = {
      liked_profiles: [],
      passed_profiles: [],
      messaged_matches: [],
      successful_dates: [],
      unmatched_profiles: []
    };
    
    interactionHistory.forEach(interaction => {
      switch (interaction.type) {
        case 'swipe_like':
          signals.liked_profiles.push(interaction);
          break;
        case 'swipe_pass':
          signals.passed_profiles.push(interaction);
          break;
        case 'message_sent':
          signals.messaged_matches.push(interaction);
          break;
        case 'date_occurred':
          signals.successful_dates.push(interaction);
          break;
        case 'unmatch':
          signals.unmatched_profiles.push(interaction);
          break;
      }
    });
    
    return signals;
  }
  
  /**
   * Update preference weights using implicit feedback
   */
  async updatePreferenceWeights(currentWeights, preferenceSignals, interactionHistory) {
    const weightUpdates = { ...currentWeights };
    
    // Analyze liked vs passed profiles to understand preferences
    const likedFeatures = this.aggregateFeatures(preferenceSignals.liked_profiles);
    const passedFeatures = this.aggregateFeatures(preferenceSignals.passed_profiles);
    
    // Calculate preference gradients
    const gradients = this.calculatePreferenceGradients(likedFeatures, passedFeatures);
    
    // Update weights based on gradients
    Object.keys(weightUpdates).forEach(weightKey => {
      if (gradients[weightKey]) {
        const gradient = gradients[weightKey];
        const currentWeight = currentWeights[weightKey];
        
        // Gradient descent update with momentum
        const momentum = 0.9;
        const previousUpdate = this.getPreviousUpdate(weightKey) || 0;
        
        const update = this.learningRate * gradient + momentum * previousUpdate;
        weightUpdates[weightKey] = Math.max(0, Math.min(1, currentWeight + update));
        
        this.storePreviousUpdate(weightKey, update);
      }
    });
    
    // Normalize weights to sum to 1
    return this.normalizeWeights(weightUpdates);
  }
  
  /**
   * Aggregate features from interaction profiles
   */
  aggregateFeatures(interactions) {
    if (interactions.length === 0) return {};
    
    const aggregated = {};
    const featureKeys = Object.keys(this.globalWeights);
    
    featureKeys.forEach(key => {
      const values = interactions
        .map(interaction => this.extractFeatureValue(interaction.targetProfile, key))
        .filter(val => val !== null && val !== undefined);
      
      if (values.length > 0) {
        aggregated[key] = {
          mean: values.reduce((sum, val) => sum + val, 0) / values.length,
          std: this.calculateStandardDeviation(values),
          count: values.length
        };
      }
    });
    
    return aggregated;
  }
  
  /**
   * Calculate preference gradients based on liked vs passed profiles
   */
  calculatePreferenceGradients(likedFeatures, passedFeatures) {
    const gradients = {};
    
    Object.keys(this.globalWeights).forEach(featureKey => {
      const likedStats = likedFeatures[featureKey];
      const passedStats = passedFeatures[featureKey];
      
      if (likedStats && passedStats && likedStats.count > 0 && passedStats.count > 0) {
        // Calculate difference in means (liked vs passed)
        const meanDifference = likedStats.mean - passedStats.mean;
        
        // Calculate statistical significance
        const pooledStd = Math.sqrt(
          (Math.pow(likedStats.std, 2) / likedStats.count) +
          (Math.pow(passedStats.std, 2) / passedStats.count)
        );
        
        const tStatistic = meanDifference / pooledStd;
        const significance = Math.min(Math.abs(tStatistic) / 2, 1); // Normalize to 0-1
        
        // Gradient based on preference strength and significance
        gradients[featureKey] = meanDifference * significance * 0.1; // Scale factor
      }
    });
    
    return gradients;
  }
  
  /**
   * Extract specific feature value from profile
   */
  extractFeatureValue(profile, featureKey) {
    switch (featureKey) {
      case 'age_importance':
        return profile.age ? profile.age / 65 : null; // Normalize age
        
      case 'location_importance':
        return profile.location_distance || 0;
        
      case 'dietary_alignment':
        return profile.dietary_preference === 'vegan' ? 1 : 0.7;
        
      case 'years_based_importance':
        return profile.years_plant_based ? Math.min(profile.years_plant_based / 10, 1) : null;
        
      case 'interest_overlap':
        return profile.interest_similarity || 0;
        
      case 'values_alignment':
        return profile.values_alignment_score || 0;
        
      case 'photo_importance':
        return profile.photo_quality_score || 0.5;
        
      case 'bio_quality_importance':
        return profile.bio_quality_score || 0.5;
        
      default:
        return profile[featureKey] || 0;
    }
  }
  
  /**
   * Calculate preference confidence based on interaction volume and consistency
   */
  calculatePreferenceConfidence(preferenceSignals) {
    const totalInteractions = Object.values(preferenceSignals)
      .reduce((sum, signals) => sum + signals.length, 0);
    
    // Volume-based confidence
    const volumeConfidence = Math.min(totalInteractions / 100, 1); // Max at 100 interactions
    
    // Consistency-based confidence (how consistent are the preferences)
    const consistencyConfidence = this.calculatePreferenceConsistency(preferenceSignals);
    
    // Combined confidence score
    return Math.sqrt(volumeConfidence * consistencyConfidence);
  }
  
  calculatePreferenceConsistency(preferenceSignals) {
    // Analyze consistency in swiping patterns over time
    const allSwipes = [
      ...preferenceSignals.liked_profiles.map(p => ({ ...p, action: 'like' })),
      ...preferenceSignals.passed_profiles.map(p => ({ ...p, action: 'pass' }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (allSwipes.length < 20) return 0.5; // Default for insufficient data
    
    // Calculate consistency in windows
    const windowSize = 10;
    const windows = [];
    
    for (let i = 0; i <= allSwipes.length - windowSize; i += 5) {
      const window = allSwipes.slice(i, i + windowSize);
      const likeRate = window.filter(s => s.action === 'like').length / windowSize;
      windows.push(likeRate);
    }
    
    if (windows.length < 2) return 0.5;
    
    // Calculate coefficient of variation
    const mean = windows.reduce((sum, rate) => sum + rate, 0) / windows.length;
    const variance = windows.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / windows.length;
    const cv = Math.sqrt(variance) / mean;
    
    // Lower CV = higher consistency
    return Math.max(0, 1 - cv);
  }
  
  /**
   * Get personalized compatibility score for a user
   */
  getPersonalizedCompatibilityScore(userId, targetProfile, baseCompatibilityScore) {
    const userModel = this.userModels.get(userId);
    
    if (!userModel || userModel.confidence < 0.3) {
      return baseCompatibilityScore; // Use base score for low confidence
    }
    
    // Calculate personalized score adjustment
    let personalizedAdjustment = 0;
    let totalWeight = 0;
    
    Object.entries(userModel.weights).forEach(([featureKey, weight]) => {
      const featureValue = this.extractFeatureValue(targetProfile, featureKey);
      
      if (featureValue !== null) {
        const globalWeight = this.globalWeights[featureKey] || 0;
        const personalizedWeight = weight;
        
        // Calculate adjustment based on difference from global preference
        const weightDifference = personalizedWeight - globalWeight;
        const adjustment = weightDifference * featureValue;
        
        personalizedAdjustment += adjustment;
        totalWeight += Math.abs(weightDifference);
      }
    });
    
    // Normalize adjustment by total weight and confidence
    if (totalWeight > 0) {
      personalizedAdjustment = (personalizedAdjustment / totalWeight) * userModel.confidence;
    }
    
    // Apply adjustment to base score
    const personalizedScore = baseCompatibilityScore + personalizedAdjustment * 0.2; // Scale factor
    
    return Math.max(0, Math.min(1, personalizedScore));
  }
  
  /**
   * Helper methods
   */
  
  initializeUserModel(userId) {
    return {
      userId,
      weights: { ...this.globalWeights },
      confidence: 0,
      lastUpdated: new Date(),
      interactionCount: 0,
      previousUpdates: {}
    };
  }
  
  getPreviousUpdate(weightKey) {
    // Implementation would retrieve from user model
    return 0;
  }
  
  storePreviousUpdate(weightKey, update) {
    // Implementation would store in user model
  }
  
  normalizeWeights(weights) {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) return weights;
    
    const normalized = {};
    Object.entries(weights).forEach(([key, weight]) => {
      normalized[key] = weight / totalWeight;
    });
    
    return normalized;
  }
  
  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
}

/**
 * TEMPORAL PATTERNS MODEL
 * Analyzes how user preferences change over time and predicts future behavior
 */
class TemporalPatternsModel {
  
  constructor() {
    this.timeSeriesModels = new Map();
    this.seasonalPatterns = {};
    this.trendAnalysis = {};
  }
  
  /**
   * Analyze temporal patterns in user behavior
   */
  analyzeTemporalPatterns(userId, interactionHistory) {
    console.log(`Analyzing temporal patterns for user ${userId}...`);
    
    // Create time series data
    const timeSeries = this.createTimeSeries(interactionHistory);
    
    // Analyze different temporal aspects
    const patterns = {
      // Daily patterns
      dailyActivity: this.analyzeDailyPatterns(timeSeries),
      
      // Weekly patterns
      weeklyPatterns: this.analyzeWeeklyPatterns(timeSeries),
      
      // Seasonal trends
      seasonalTrends: this.analyzeSeasonalTrends(timeSeries),
      
      // Preference evolution
      preferenceEvolution: this.analyzePreferenceEvolution(timeSeries),
      
      // Activity level changes
      activityTrends: this.analyzeActivityTrends(timeSeries)
    };
    
    this.timeSeriesModels.set(userId, patterns);
    
    return patterns;
  }
  
  /**
   * Create time series from interaction history
   */
  createTimeSeries(interactionHistory) {
    // Group interactions by day
    const dailySeries = {};
    
    interactionHistory.forEach(interaction => {
      const date = new Date(interaction.timestamp).toISOString().split('T')[0];
      
      if (!dailySeries[date]) {
        dailySeries[date] = {
          date,
          likes: 0,
          passes: 0,
          messages: 0,
          matches: 0,
          activity_score: 0,
          selectivity: 0,
          response_times: []
        };
      }
      
      const dayData = dailySeries[date];
      
      switch (interaction.type) {
        case 'swipe_like':
          dayData.likes++;
          break;
        case 'swipe_pass':
          dayData.passes++;
          break;
        case 'message_sent':
          dayData.messages++;
          if (interaction.response_time) {
            dayData.response_times.push(interaction.response_time);
          }
          break;
        case 'match_created':
          dayData.matches++;
          break;
      }
      
      dayData.activity_score = dayData.likes + dayData.passes + dayData.messages;
      dayData.selectivity = dayData.likes + dayData.passes > 0 ? 
        dayData.likes / (dayData.likes + dayData.passes) : 0;
    });
    
    // Convert to sorted array
    return Object.values(dailySeries).sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  /**
   * Analyze daily activity patterns
   */
  analyzeDailyPatterns(timeSeries) {
    const hourlyActivity = Array(24).fill(0);
    const hourlySelectivity = Array(24).fill(0);
    const hourlyCounts = Array(24).fill(0);
    
    // Would need hour-level data for this analysis
    // Placeholder implementation
    
    return {
      peakHours: [19, 20, 21], // 7-9 PM typical peak
      lowActivityHours: [2, 3, 4, 5, 6], // Early morning
      avgDailyActivity: timeSeries.reduce((sum, day) => sum + day.activity_score, 0) / timeSeries.length,
      dailyConsistency: this.calculateConsistency(timeSeries.map(d => d.activity_score))
    };
  }
  
  /**
   * Analyze weekly patterns
   */
  analyzeWeeklyPatterns(timeSeries) {
    const weeklyStats = Array(7).fill().map(() => ({
      activity: 0,
      selectivity: 0,
      count: 0
    }));
    
    timeSeries.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay();
      weeklyStats[dayOfWeek].activity += day.activity_score;
      weeklyStats[dayOfWeek].selectivity += day.selectivity;
      weeklyStats[dayOfWeek].count++;
    });
    
    // Calculate averages
    weeklyStats.forEach(stat => {
      if (stat.count > 0) {
        stat.activity /= stat.count;
        stat.selectivity /= stat.count;
      }
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      weeklyActivity: weeklyStats.map((stat, i) => ({
        day: dayNames[i],
        activity: stat.activity,
        selectivity: stat.selectivity
      })),
      mostActiveDay: dayNames[weeklyStats.findIndex(stat => 
        stat.activity === Math.max(...weeklyStats.map(s => s.activity))
      )],
      weekendVsWeekday: this.compareWeekendVsWeekday(weeklyStats)
    };
  }
  
  /**
   * Analyze seasonal trends
   */
  analyzeSeasonalTrends(timeSeries) {
    const monthlyStats = Array(12).fill().map(() => ({
      activity: 0,
      selectivity: 0,
      matches: 0,
      count: 0
    }));
    
    timeSeries.forEach(day => {
      const month = new Date(day.date).getMonth();
      monthlyStats[month].activity += day.activity_score;
      monthlyStats[month].selectivity += day.selectivity;
      monthlyStats[month].matches += day.matches;
      monthlyStats[month].count++;
    });
    
    // Calculate averages
    monthlyStats.forEach(stat => {
      if (stat.count > 0) {
        stat.activity /= stat.count;
        stat.selectivity /= stat.count;
        stat.matches /= stat.count;
      }
    });
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      monthlyTrends: monthlyStats.map((stat, i) => ({
        month: monthNames[i],
        activity: stat.activity,
        selectivity: stat.selectivity,
        matches: stat.matches
      })),
      peakSeason: this.identifyPeakSeason(monthlyStats),
      seasonalVariation: this.calculateSeasonalVariation(monthlyStats)
    };
  }
  
  /**
   * Analyze how preferences evolve over time
   */
  analyzePreferenceEvolution(timeSeries) {
    if (timeSeries.length < 30) return null; // Need sufficient data
    
    // Create windows for trend analysis
    const windowSize = 7; // Weekly windows
    const windows = [];
    
    for (let i = 0; i <= timeSeries.length - windowSize; i += windowSize) {
      const window = timeSeries.slice(i, i + windowSize);
      const windowStats = {
        period: i / windowSize + 1,
        avgSelectivity: window.reduce((sum, day) => sum + day.selectivity, 0) / window.length,
        avgActivity: window.reduce((sum, day) => sum + day.activity_score, 0) / window.length,
        avgResponseTime: this.calculateAvgResponseTime(window)
      };
      windows.push(windowStats);
    }
    
    return {
      selectivityTrend: this.calculateTrend(windows.map(w => w.avgSelectivity)),
      activityTrend: this.calculateTrend(windows.map(w => w.avgActivity)),
      responseTimeTrend: this.calculateTrend(windows.map(w => w.avgResponseTime)),
      windows
    };
  }
  
  /**
   * Predict future behavior based on temporal patterns
   */
  predictFutureBehavior(userId, daysAhead = 7) {
    const patterns = this.timeSeriesModels.get(userId);
    
    if (!patterns) {
      return null;
    }
    
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const dayOfWeek = futureDate.getDay();
      const month = futureDate.getMonth();
      const hour = futureDate.getHours();
      
      // Combine different pattern predictions
      const weeklyPrediction = patterns.weeklyPatterns.weeklyActivity[dayOfWeek];
      const seasonalPrediction = patterns.seasonalTrends.monthlyTrends[month];
      const dailyPrediction = patterns.dailyActivity;
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predictedActivity: this.combinePredictions([
          weeklyPrediction.activity,
          seasonalPrediction.activity,
          dailyPrediction.avgDailyActivity
        ]),
        predictedSelectivity: this.combinePredictions([
          weeklyPrediction.selectivity,
          seasonalPrediction.selectivity
        ]),
        confidence: this.calculatePredictionConfidence(patterns, i)
      });
    }
    
    return predictions;
  }
  
  /**
   * Helper methods for temporal analysis
   */
  
  calculateConsistency(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const cv = Math.sqrt(variance) / mean;
    
    return Math.max(0, 1 - cv); // Higher consistency = lower coefficient of variation
  }
  
  compareWeekendVsWeekday(weeklyStats) {
    const weekdayActivity = weeklyStats.slice(1, 6).reduce((sum, stat) => sum + stat.activity, 0) / 5;
    const weekendActivity = (weeklyStats[0].activity + weeklyStats[6].activity) / 2;
    
    return {
      weekdayAvg: weekdayActivity,
      weekendAvg: weekendActivity,
      weekendBoost: weekendActivity / weekdayActivity - 1
    };
  }
  
  identifyPeakSeason(monthlyStats) {
    const maxActivity = Math.max(...monthlyStats.map(s => s.activity));
    const peakMonthIndex = monthlyStats.findIndex(s => s.activity === maxActivity);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return monthNames[peakMonthIndex];
  }
  
  calculateSeasonalVariation(monthlyStats) {
    const activities = monthlyStats.map(s => s.activity);
    const mean = activities.reduce((sum, val) => sum + val, 0) / activities.length;
    const variance = activities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / activities.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
  
  calculateAvgResponseTime(window) {
    const allResponseTimes = window.flatMap(day => day.response_times);
    
    if (allResponseTimes.length === 0) return 0;
    
    return allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  combinePredictions(predictions) {
    const validPredictions = predictions.filter(p => p !== null && !isNaN(p));
    
    if (validPredictions.length === 0) return 0;
    
    return validPredictions.reduce((sum, pred) => sum + pred, 0) / validPredictions.length;
  }
  
  calculatePredictionConfidence(patterns, daysAhead) {
    // Confidence decreases with days ahead and increases with data quality
    const baseConfidence = 0.8;
    const daysPenalty = 0.05 * daysAhead; // 5% penalty per day
    const dataQuality = patterns.dailyActivity.dailyConsistency || 0.5;
    
    return Math.max(0.1, baseConfidence - daysPenalty + dataQuality * 0.2);
  }
}

module.exports = {
  IndividualPreferenceLearningModel,
  TemporalPatternsModel
};