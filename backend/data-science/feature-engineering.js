/**
 * PLANTED MATCHING ALGORITHM - FEATURE ENGINEERING FRAMEWORK
 * 
 * Comprehensive data science framework for statistical modeling,
 * feature engineering, and algorithm validation for plant-based dating compatibility.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const mongoose = require('mongoose');

/**
 * USER PROFILE FEATURES EXTRACTION
 * Transforms raw user data into machine learning ready features
 */
class UserFeatureExtractor {
  
  /**
   * Extract demographic feature vectors
   */
  static extractDemographicFeatures(user) {
    const age = user.age;
    const ageNormalized = (age - 18) / (65 - 18); // Normalize age to 0-1
    
    return {
      // Age features
      age_normalized: ageNormalized,
      age_category: this.categorizeAge(age),
      generation: this.getGeneration(age),
      
      // Gender and orientation features
      gender_vector: this.encodeGender(user.gender),
      orientation_vector: this.encodeOrientation(user.interestedIn),
      orientation_compatibility: this.getOrientationCompatibility(user.gender, user.interestedIn),
      
      // Geographic features
      location_features: this.extractLocationFeatures(user.location),
      location_tier: this.getLocationTier(user.location.city),
      
      // Education and profession (if available)
      education_level: user.education ? this.encodeEducation(user.education) : null,
      profession_category: user.profession ? this.encodeProfession(user.profession) : null
    };
  }
  
  /**
   * Extract dietary journey and plant-based commitment features
   */
  static extractDietaryJourneyFeatures(user, userBehavior = null) {
    const currentDate = new Date();
    const yearsBased = user.yearsBased;
    
    return {
      // Core dietary features
      dietary_type: user.dietaryPreference === 'vegan' ? 1 : 0.7, // Vegan=1, Vegetarian=0.7
      years_plant_based: yearsBased,
      years_normalized: Math.min(yearsBased / 10, 1), // Normalize to 0-1, cap at 10 years
      commitment_level: this.calculateCommitmentLevel(yearsBased, user.dietaryPreference),
      
      // Motivation analysis from bio text
      motivation_scores: this.extractMotivationScores(user.whyPlantBased),
      
      // Journey phase classification
      journey_phase: this.classifyJourneyPhase(yearsBased),
      
      // Strictness evolution (if behavioral data available)
      strictness_trend: userBehavior ? this.calculateStrictnessTrend(userBehavior) : null,
      
      // Community engagement indicators
      activism_indicator: this.detectActivismLevel(user.interests, user.whyPlantBased),
      sustainability_focus: this.detectSustainabilityFocus(user.interests, user.whyPlantBased)
    };
  }
  
  /**
   * Extract values alignment and lifestyle compatibility features
   */
  static extractValuesAlignmentFeatures(user) {
    return {
      // Core values from text analysis
      ethical_priorities: this.extractEthicalPriorities(user.whyPlantBased),
      
      // Lifestyle indicators
      health_focus: this.detectHealthFocus(user.whyPlantBased, user.interests),
      environmental_focus: this.detectEnvironmentalFocus(user.whyPlantBased, user.interests),
      animal_rights_focus: this.detectAnimalRightsFocus(user.whyPlantBased, user.interests),
      
      // Social and cultural factors
      cooking_engagement: this.encodeCookingLevel(user.cookingSkill),
      social_dining_preferences: this.extractSocialDiningPrefs(user.favoriteRestaurants),
      
      // Interest compatibility vectors
      interest_vector: this.createInterestVector(user.interests),
      lifestyle_activity_level: this.calculateActivityLevel(user.interests),
      mindfulness_score: this.calculateMindfulnessScore(user.interests)
    };
  }
  
  /**
   * Extract behavioral features from app usage patterns
   */
  static extractBehavioralFeatures(userBehavior) {
    if (!userBehavior) return null;
    
    return {
      // App usage patterns
      session_frequency: userBehavior.sessionsPerWeek || 0,
      session_duration_avg: userBehavior.avgSessionDuration || 0,
      peak_usage_times: userBehavior.peakUsageTimes || [],
      
      // Engagement quality
      message_response_rate: userBehavior.messageResponseRate || 0,
      avg_response_time_hours: userBehavior.avgResponseTimeHours || 24,
      conversation_starter_rate: userBehavior.conversationStarterRate || 0,
      
      // Profile interaction patterns
      profile_view_to_like_ratio: userBehavior.viewToLikeRatio || 0,
      selective_swiping_score: userBehavior.selectiveSwipingScore || 0.5,
      super_like_usage_rate: userBehavior.superLikeUsageRate || 0,
      
      // Quality indicators
      message_length_avg: userBehavior.avgMessageLength || 0,
      photo_quality_score: userBehavior.photoQualityScore || 0.5,
      profile_completeness: userBehavior.profileCompleteness || 0
    };
  }
  
  /**
   * Helper methods for feature extraction
   */
  
  static categorizeAge(age) {
    if (age < 25) return 'young_adult';
    if (age < 35) return 'early_career';
    if (age < 45) return 'established';
    if (age < 55) return 'mature';
    return 'senior';
  }
  
  static getGeneration(age) {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    
    if (birthYear >= 1997) return 'gen_z';
    if (birthYear >= 1981) return 'millennial';
    if (birthYear >= 1965) return 'gen_x';
    return 'boomer';
  }
  
  static encodeGender(gender) {
    const genderMap = {
      'male': [1, 0, 0, 0],
      'female': [0, 1, 0, 0],
      'non-binary': [0, 0, 1, 0],
      'other': [0, 0, 0, 1]
    };
    return genderMap[gender] || [0, 0, 0, 0];
  }
  
  static encodeOrientation(interestedIn) {
    const orientationMap = {
      'male': [1, 0, 0, 0],
      'female': [0, 1, 0, 0],
      'both': [0, 0, 1, 0],
      'all': [0, 0, 0, 1]
    };
    return orientationMap[interestedIn] || [0, 0, 0, 0];
  }
  
  static extractLocationFeatures(location) {
    return {
      city: location.city,
      state: location.state || '',
      country: location.country || 'USA',
      has_coordinates: location.coordinates && location.coordinates.length === 2,
      coordinates: location.coordinates || [0, 0],
      // Population tier, cost of living, vegan scene rating could be added
    };
  }
  
  static getLocationTier(city) {
    // Classify cities by vegan scene strength and population
    const tier1Cities = ['Los Angeles', 'New York', 'San Francisco', 'Portland', 'Austin', 'Seattle'];
    const tier2Cities = ['Chicago', 'Denver', 'Atlanta', 'Miami', 'Boston', 'Philadelphia'];
    
    if (tier1Cities.includes(city)) return 1;
    if (tier2Cities.includes(city)) return 2;
    return 3;
  }
  
  static calculateCommitmentLevel(yearsBased, dietaryType) {
    let baseScore = Math.min(yearsBased / 5, 1); // 0-1 based on years
    if (dietaryType === 'vegan') baseScore *= 1.2; // Boost for vegans
    return Math.min(baseScore, 1);
  }
  
  static extractMotivationScores(whyPlantBasedText) {
    const text = whyPlantBasedText.toLowerCase();
    
    return {
      health_motivation: this.scoreTextForThemes(text, ['health', 'wellness', 'energy', 'nutrition', 'fitness']),
      environmental_motivation: this.scoreTextForThemes(text, ['environment', 'climate', 'planet', 'sustainability', 'carbon']),
      ethical_motivation: this.scoreTextForThemes(text, ['animals', 'cruelty', 'suffering', 'compassion', 'ethics']),
      spiritual_motivation: this.scoreTextForThemes(text, ['spiritual', 'consciousness', 'mindful', 'peace', 'karma'])
    };
  }
  
  static scoreTextForThemes(text, keywords) {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 1;
    });
    return Math.min(score / keywords.length, 1);
  }
  
  static classifyJourneyPhase(yearsBased) {
    if (yearsBased < 1) return 'newcomer';
    if (yearsBased < 3) return 'developing';
    if (yearsBased < 7) return 'established';
    return 'veteran';
  }
  
  static createInterestVector(interests) {
    // Create a vector representation of interests
    const allInterests = ['cooking', 'fitness', 'yoga', 'meditation', 'hiking', 'travel', 
                         'music', 'art', 'reading', 'gardening', 'activism', 'sustainability'];
    
    return allInterests.map(interest => interests.includes(interest) ? 1 : 0);
  }
  
  static calculateActivityLevel(interests) {
    const activeInterests = ['fitness', 'yoga', 'hiking', 'gardening'];
    const activeCount = interests.filter(i => activeInterests.includes(i)).length;
    return activeCount / activeInterests.length;
  }
  
  static calculateMindfulnessScore(interests) {
    const mindfulInterests = ['yoga', 'meditation', 'gardening', 'reading'];
    const mindfulCount = interests.filter(i => mindfulInterests.includes(i)).length;
    return mindfulCount / mindfulInterests.length;
  }
  
  static encodeCookingLevel(cookingSkill) {
    const cookingMap = {
      'beginner': 0.25,
      'intermediate': 0.5,
      'advanced': 0.75,
      'chef-level': 1.0
    };
    return cookingMap[cookingSkill] || 0.25;
  }
}

/**
 * INTERACTION FEATURES EXTRACTION
 * Analyzes user interactions, swipe patterns, and engagement metrics
 */
class InteractionFeatureExtractor {
  
  /**
   * Extract swipe pattern features
   */
  static extractSwipeFeatures(userSwipeHistory) {
    if (!userSwipeHistory || userSwipeHistory.length === 0) return null;
    
    const totalSwipes = userSwipeHistory.length;
    const likes = userSwipeHistory.filter(s => s.action === 'like').length;
    const passes = userSwipeHistory.filter(s => s.action === 'pass').length;
    const superLikes = userSwipeHistory.filter(s => s.superLike === true).length;
    
    return {
      // Basic swipe metrics
      total_swipes: totalSwipes,
      like_rate: likes / totalSwipes,
      pass_rate: passes / totalSwipes,
      super_like_rate: superLikes / totalSwipes,
      
      // Decision time analysis
      avg_decision_time_seconds: this.calculateAvgDecisionTime(userSwipeHistory),
      quick_decision_rate: this.calculateQuickDecisionRate(userSwipeHistory),
      
      // Selectivity patterns
      selectivity_score: this.calculateSelectivityScore(userSwipeHistory),
      consistency_score: this.calculateConsistencyScore(userSwipeHistory),
      
      // Temporal patterns
      daily_swipe_distribution: this.calculateDailySwipeDistribution(userSwipeHistory),
      swipe_momentum: this.calculateSwipeMomentum(userSwipeHistory)
    };
  }
  
  /**
   * Extract message engagement features
   */
  static extractMessageFeatures(userMessageHistory) {
    if (!userMessageHistory || userMessageHistory.length === 0) return null;
    
    return {
      // Response patterns
      response_rate: this.calculateResponseRate(userMessageHistory),
      avg_response_time_hours: this.calculateAvgResponseTime(userMessageHistory),
      response_time_consistency: this.calculateResponseTimeConsistency(userMessageHistory),
      
      // Message quality
      avg_message_length: this.calculateAvgMessageLength(userMessageHistory),
      message_quality_score: this.calculateMessageQuality(userMessageHistory),
      conversation_starter_quality: this.evaluateConversationStarters(userMessageHistory),
      
      // Engagement depth
      conversation_duration_avg: this.calculateAvgConversationDuration(userMessageHistory),
      emoji_usage_rate: this.calculateEmojiUsage(userMessageHistory),
      question_asking_rate: this.calculateQuestionRate(userMessageHistory),
      
      // Relationship progression
      date_suggestion_rate: this.calculateDateSuggestionRate(userMessageHistory),
      phone_number_exchange_rate: this.calculatePhoneExchangeRate(userMessageHistory)
    };
  }
  
  /**
   * Extract profile viewing and interaction patterns
   */
  static extractProfileInteractionFeatures(userViewHistory) {
    if (!userViewHistory || userViewHistory.length === 0) return null;
    
    return {
      // Viewing behavior
      profile_view_frequency: userViewHistory.length,
      avg_view_duration_seconds: this.calculateAvgViewDuration(userViewHistory),
      photo_browsing_thoroughness: this.calculatePhotoBrowsingThoroughness(userViewHistory),
      
      // Attention patterns
      bio_reading_rate: this.calculateBioReadingRate(userViewHistory),
      detail_attention_score: this.calculateDetailAttentionScore(userViewHistory),
      
      // Conversion patterns
      view_to_like_conversion: this.calculateViewToLikeConversion(userViewHistory),
      view_to_message_conversion: this.calculateViewToMessageConversion(userViewHistory)
    };
  }
  
  /**
   * Helper methods for interaction analysis
   */
  
  static calculateAvgDecisionTime(swipeHistory) {
    const decisions = swipeHistory.filter(s => s.decisionTimeSeconds != null);
    if (decisions.length === 0) return 0;
    
    const totalTime = decisions.reduce((sum, s) => sum + s.decisionTimeSeconds, 0);
    return totalTime / decisions.length;
  }
  
  static calculateQuickDecisionRate(swipeHistory) {
    const quickThreshold = 3; // seconds
    const quickDecisions = swipeHistory.filter(s => 
      s.decisionTimeSeconds != null && s.decisionTimeSeconds < quickThreshold
    ).length;
    
    return quickDecisions / swipeHistory.length;
  }
  
  static calculateSelectivityScore(swipeHistory) {
    // Higher score = more selective (lower like rate)
    const likeRate = swipeHistory.filter(s => s.action === 'like').length / swipeHistory.length;
    return 1 - likeRate;
  }
  
  static calculateConsistencyScore(swipeHistory) {
    // Analyze consistency in swiping patterns over time
    const windows = this.createTimeWindows(swipeHistory, 7); // Weekly windows
    const likeRates = windows.map(window => 
      window.filter(s => s.action === 'like').length / window.length
    );
    
    if (likeRates.length < 2) return 1;
    
    // Calculate coefficient of variation (lower = more consistent)
    const mean = likeRates.reduce((sum, rate) => sum + rate, 0) / likeRates.length;
    const variance = likeRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / likeRates.length;
    const cv = Math.sqrt(variance) / mean;
    
    return Math.max(0, 1 - cv); // Invert so higher score = more consistent
  }
  
  static createTimeWindows(history, windowDays) {
    // Group history items into time windows
    const windows = [];
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    
    if (history.length === 0) return windows;
    
    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const startTime = new Date(sortedHistory[0].timestamp).getTime();
    
    let currentWindow = [];
    let currentWindowStart = startTime;
    
    sortedHistory.forEach(item => {
      const itemTime = new Date(item.timestamp).getTime();
      
      if (itemTime < currentWindowStart + windowMs) {
        currentWindow.push(item);
      } else {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [item];
        currentWindowStart = itemTime;
      }
    });
    
    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }
    
    return windows;
  }
}

module.exports = {
  UserFeatureExtractor,
  InteractionFeatureExtractor
};