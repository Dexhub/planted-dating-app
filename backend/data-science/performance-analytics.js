/**
 * PLANTED MATCHING ALGORITHM - PERFORMANCE ANALYTICS
 * 
 * Algorithm effectiveness metrics, business impact measurement,
 * and comprehensive performance tracking for the matching system.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const EventEmitter = require('events');

/**
 * ALGORITHM EFFECTIVENESS METRICS
 * Tracks precision, recall, NDCG, diversity, and coverage metrics
 */
class AlgorithmEffectivenessAnalyzer extends EventEmitter {
  
  constructor() {
    super();
    this.metrics = {};
    this.historicalData = [];
    this.benchmarks = this.initializeBenchmarks();
  }
  
  /**
   * Initialize performance benchmarks
   */
  initializeBenchmarks() {
    return {
      // Recommendation quality benchmarks
      precision_at_k: {
        k5: 0.30,   // 30% of top 5 recommendations should be liked
        k10: 0.25,  // 25% of top 10 recommendations should be liked
        k20: 0.20   // 20% of top 20 recommendations should be liked
      },
      
      // Ranking quality benchmarks
      ndcg: {
        k5: 0.35,   // NDCG@5 target
        k10: 0.40,  // NDCG@10 target
        k20: 0.42   // NDCG@20 target
      },
      
      // Diversity benchmarks
      diversity_metrics: {
        intra_list_diversity: 0.70,    // 70% diversity within recommendations
        temporal_diversity: 0.60,      // 60% diversity across time periods
        demographic_diversity: 0.65    // 65% diversity across demographics
      },
      
      // Coverage benchmarks
      coverage_metrics: {
        user_coverage: 0.95,        // 95% of users should receive recommendations
        item_coverage: 0.80,        // 80% of profiles should be recommended
        long_tail_coverage: 0.30    // 30% coverage of less popular profiles
      },
      
      // Business impact benchmarks
      business_metrics: {
        match_rate: 0.15,           // 15% of recommendations should result in matches
        conversation_rate: 0.60,    // 60% of matches should start conversations
        date_conversion: 0.25,      // 25% of conversations should lead to dates
        retention_rate: 0.80        // 80% user retention after 30 days
      }
    };
  }
  
  /**
   * Calculate comprehensive algorithm effectiveness metrics
   */
  async calculateEffectivenessMetrics(recommendations, userInteractions, timeWindow = 30) {
    console.log('Calculating algorithm effectiveness metrics...');
    
    const metrics = {
      timestamp: new Date(),
      timeWindow,
      
      // Precision metrics
      precision: await this.calculatePrecisionMetrics(recommendations, userInteractions),
      
      // Ranking quality metrics
      ranking: await this.calculateRankingMetrics(recommendations, userInteractions),
      
      // Diversity metrics
      diversity: await this.calculateDiversityMetrics(recommendations),
      
      // Coverage metrics
      coverage: await this.calculateCoverageMetrics(recommendations),
      
      // Novelty and serendipity
      novelty: await this.calculateNoveltyMetrics(recommendations, userInteractions),
      
      // Temporal consistency
      consistency: await this.calculateConsistencyMetrics(recommendations)
    };
    
    // Store metrics
    this.metrics = metrics;
    this.historicalData.push(metrics);
    
    // Emit metrics update event
    this.emit('metricsUpdated', metrics);
    
    return metrics;
  }
  
  /**
   * Calculate precision at different K values
   */
  async calculatePrecisionMetrics(recommendations, userInteractions) {
    const kValues = [5, 10, 20];
    const precisionMetrics = {};
    
    // Group interactions by user
    const userInteractionMap = new Map();
    userInteractions.forEach(interaction => {
      if (!userInteractionMap.has(interaction.userId)) {
        userInteractionMap.set(interaction.userId, []);
      }
      userInteractionMap.get(interaction.userId).push(interaction);
    });
    
    for (const k of kValues) {
      let totalPrecision = 0;
      let userCount = 0;
      
      // Calculate precision@K for each user
      recommendations.forEach(userRecs => {
        const userId = userRecs.userId;
        const topKRecs = userRecs.recommendations.slice(0, k);
        const userInteractionsData = userInteractionMap.get(userId) || [];
        
        // Count how many of top K were liked/matched
        const relevantItems = topKRecs.filter(rec => 
          userInteractionsData.some(interaction => 
            interaction.targetUserId === rec.targetUserId && 
            (interaction.action === 'like' || interaction.action === 'match')
          )
        );
        
        const precision = relevantItems.length / k;
        totalPrecision += precision;
        userCount++;
      });
      
      precisionMetrics[`precision_at_${k}`] = userCount > 0 ? totalPrecision / userCount : 0;
    }
    
    return precisionMetrics;
  }
  
  /**
   * Calculate NDCG and other ranking metrics
   */
  async calculateRankingMetrics(recommendations, userInteractions) {
    const kValues = [5, 10, 20];
    const rankingMetrics = {};
    
    // Group interactions by user with relevance scores
    const userRelevanceMap = this.buildRelevanceMap(userInteractions);
    
    for (const k of kValues) {
      let totalNDCG = 0;
      let totalMAP = 0;
      let userCount = 0;
      
      recommendations.forEach(userRecs => {
        const userId = userRecs.userId;
        const topKRecs = userRecs.recommendations.slice(0, k);
        const relevanceScores = userRelevanceMap.get(userId) || new Map();
        
        // Calculate NDCG@K
        const ndcg = this.calculateNDCG(topKRecs, relevanceScores, k);
        totalNDCG += ndcg;
        
        // Calculate MAP@K
        const map = this.calculateMAP(topKRecs, relevanceScores, k);
        totalMAP += map;
        
        userCount++;
      });
      
      rankingMetrics[`ndcg_at_${k}`] = userCount > 0 ? totalNDCG / userCount : 0;
      rankingMetrics[`map_at_${k}`] = userCount > 0 ? totalMAP / userCount : 0;
    }
    
    return rankingMetrics;
  }
  
  /**
   * Calculate diversity metrics
   */
  async calculateDiversityMetrics(recommendations) {
    return {
      // Intra-list diversity (diversity within each user's recommendations)
      intra_list_diversity: this.calculateIntraListDiversity(recommendations),
      
      // Inter-list diversity (diversity across users' recommendations)
      inter_list_diversity: this.calculateInterListDiversity(recommendations),
      
      // Temporal diversity (how recommendations change over time)
      temporal_diversity: this.calculateTemporalDiversity(recommendations),
      
      // Demographic diversity
      demographic_diversity: this.calculateDemographicDiversity(recommendations),
      
      // Feature diversity
      feature_diversity: this.calculateFeatureDiversity(recommendations)
    };
  }
  
  /**
   * Calculate coverage metrics
   */
  async calculateCoverageMetrics(recommendations) {
    // Collect all unique users and items
    const allUsers = new Set();
    const allRecommendedItems = new Set();
    const itemFrequency = new Map();
    
    recommendations.forEach(userRecs => {
      allUsers.add(userRecs.userId);
      
      userRecs.recommendations.forEach(rec => {
        allRecommendedItems.add(rec.targetUserId);
        itemFrequency.set(rec.targetUserId, (itemFrequency.get(rec.targetUserId) || 0) + 1);
      });
    });
    
    // Calculate coverage metrics
    const totalUsers = allUsers.size;
    const totalItems = allRecommendedItems.size;
    
    // Long tail analysis (items recommended less frequently)
    const sortedItems = Array.from(itemFrequency.entries())
      .sort((a, b) => a[1] - b[1]); // Sort by frequency ascending
    
    const longTailThreshold = Math.ceil(totalItems * 0.8); // Bottom 80% by frequency
    const longTailItems = sortedItems.slice(0, longTailThreshold);
    
    return {
      user_coverage: totalUsers / (totalUsers || 1), // Ratio of users receiving recs
      item_coverage: totalItems, // Number of unique items recommended
      catalog_coverage: totalItems / (totalItems || 1), // Ratio of catalog covered
      long_tail_coverage: longTailItems.length / (totalItems || 1),
      gini_coefficient: this.calculateGiniCoefficient(Array.from(itemFrequency.values())),
      
      // Popular vs long-tail distribution
      popularity_distribution: {
        head: sortedItems.slice(-Math.ceil(totalItems * 0.2)).length, // Top 20%
        torso: sortedItems.slice(Math.ceil(totalItems * 0.2), -Math.ceil(totalItems * 0.2)).length,
        tail: longTailItems.length
      }
    };
  }
  
  /**
   * Calculate novelty and serendipity metrics
   */
  async calculateNoveltyMetrics(recommendations, userInteractions) {
    const userHistoryMap = this.buildUserHistoryMap(userInteractions);
    
    let totalNovelty = 0;
    let totalSerendipity = 0;
    let userCount = 0;
    
    recommendations.forEach(userRecs => {
      const userId = userRecs.userId;
      const userHistory = userHistoryMap.get(userId) || new Set();
      
      // Calculate novelty (how many recs are new to the user)
      const novelItems = userRecs.recommendations.filter(rec => 
        !userHistory.has(rec.targetUserId)
      );
      const novelty = novelItems.length / userRecs.recommendations.length;
      
      // Calculate serendipity (unexpected but relevant recommendations)
      const serendipity = this.calculateSerendipity(userRecs.recommendations, userHistory);
      
      totalNovelty += novelty;
      totalSerendipity += serendipity;
      userCount++;
    });
    
    return {
      novelty: userCount > 0 ? totalNovelty / userCount : 0,
      serendipity: userCount > 0 ? totalSerendipity / userCount : 0,
      exploration_rate: this.calculateExplorationRate(recommendations, userHistoryMap)
    };
  }
  
  /**
   * Helper methods for metric calculations
   */
  
  buildRelevanceMap(userInteractions) {
    const relevanceMap = new Map();
    
    userInteractions.forEach(interaction => {
      if (!relevanceMap.has(interaction.userId)) {
        relevanceMap.set(interaction.userId, new Map());
      }
      
      const userRelevance = relevanceMap.get(interaction.userId);
      
      // Assign relevance scores based on interaction type
      let relevanceScore = 0;
      switch (interaction.action) {
        case 'like':
          relevanceScore = 1;
          break;
        case 'super_like':
          relevanceScore = 2;
          break;
        case 'match':
          relevanceScore = 3;
          break;
        case 'message':
          relevanceScore = 4;
          break;
        case 'date':
          relevanceScore = 5;
          break;
        default:
          relevanceScore = 0;
      }
      
      userRelevance.set(interaction.targetUserId, relevanceScore);
    });
    
    return relevanceMap;
  }
  
  calculateNDCG(recommendations, relevanceScores, k) {
    // Calculate DCG
    let dcg = 0;
    for (let i = 0; i < Math.min(recommendations.length, k); i++) {
      const item = recommendations[i];
      const relevance = relevanceScores.get(item.targetUserId) || 0;
      dcg += relevance / Math.log2(i + 2);
    }
    
    // Calculate IDCG (ideal DCG)
    const idealRelevanceScores = Array.from(relevanceScores.values())
      .sort((a, b) => b - a)
      .slice(0, k);
    
    let idcg = 0;
    for (let i = 0; i < idealRelevanceScores.length; i++) {
      idcg += idealRelevanceScores[i] / Math.log2(i + 2);
    }
    
    return idcg > 0 ? dcg / idcg : 0;
  }
  
  calculateMAP(recommendations, relevanceScores, k) {
    let ap = 0;
    let relevantCount = 0;
    
    for (let i = 0; i < Math.min(recommendations.length, k); i++) {
      const item = recommendations[i];
      const relevance = relevanceScores.get(item.targetUserId) || 0;
      
      if (relevance > 0) {
        relevantCount++;
        ap += relevantCount / (i + 1);
      }
    }
    
    const totalRelevant = Array.from(relevanceScores.values()).filter(r => r > 0).length;
    return totalRelevant > 0 ? ap / totalRelevant : 0;
  }
  
  calculateIntraListDiversity(recommendations) {
    let totalDiversity = 0;
    let userCount = 0;
    
    recommendations.forEach(userRecs => {
      const recs = userRecs.recommendations;
      let pairwiseDiversity = 0;
      let pairCount = 0;
      
      // Calculate pairwise diversity within the list
      for (let i = 0; i < recs.length; i++) {
        for (let j = i + 1; j < recs.length; j++) {
          const diversity = this.calculateItemDiversity(recs[i], recs[j]);
          pairwiseDiversity += diversity;
          pairCount++;
        }
      }
      
      const avgDiversity = pairCount > 0 ? pairwiseDiversity / pairCount : 0;
      totalDiversity += avgDiversity;
      userCount++;
    });
    
    return userCount > 0 ? totalDiversity / userCount : 0;
  }
  
  calculateItemDiversity(item1, item2) {
    // Calculate diversity based on profile features
    let diversityScore = 0;
    let featureCount = 0;
    
    // Age diversity
    if (item1.age && item2.age) {
      const ageDiff = Math.abs(item1.age - item2.age) / 50; // Normalize by max age range
      diversityScore += Math.min(ageDiff, 1);
      featureCount++;
    }
    
    // Location diversity
    if (item1.location && item2.location) {
      const locationDiff = item1.location !== item2.location ? 1 : 0;
      diversityScore += locationDiff;
      featureCount++;
    }
    
    // Interest diversity
    if (item1.interests && item2.interests) {
      const interestOverlap = this.calculateJaccardSimilarity(item1.interests, item2.interests);
      diversityScore += (1 - interestOverlap);
      featureCount++;
    }
    
    // Plant-based journey diversity
    if (item1.yearsPlantBased && item2.yearsPlantBased) {
      const journeyDiff = Math.abs(item1.yearsPlantBased - item2.yearsPlantBased) / 10;
      diversityScore += Math.min(journeyDiff, 1);
      featureCount++;
    }
    
    return featureCount > 0 ? diversityScore / featureCount : 0;
  }
  
  calculateJaccardSimilarity(set1, set2) {
    const intersection = set1.filter(item => set2.includes(item)).length;
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  }
  
  calculateGiniCoefficient(values) {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);
    
    if (sum === 0) return 0;
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sortedValues[i];
    }
    
    return gini / (n * sum);
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const currentMetrics = this.metrics;
    const benchmarks = this.benchmarks;
    
    if (!currentMetrics) {
      return { error: 'No metrics available. Run calculateEffectivenessMetrics first.' };
    }
    
    const report = {
      timestamp: new Date(),
      summary: {
        overall_score: this.calculateOverallScore(currentMetrics, benchmarks),
        status: 'healthy', // Will be determined by benchmarks
        key_insights: []
      },
      
      precision_performance: this.evaluateAgainstBenchmarks(
        currentMetrics.precision, 
        benchmarks.precision_at_k
      ),
      
      ranking_performance: this.evaluateAgainstBenchmarks(
        currentMetrics.ranking,
        benchmarks.ndcg
      ),
      
      diversity_performance: this.evaluateAgainstBenchmarks(
        currentMetrics.diversity,
        benchmarks.diversity_metrics
      ),
      
      coverage_performance: this.evaluateAgainstBenchmarks(
        currentMetrics.coverage,
        benchmarks.coverage_metrics
      ),
      
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations(currentMetrics, benchmarks)
    };
    
    return report;
  }
  
  calculateOverallScore(metrics, benchmarks) {
    // Weighted average of different metric categories
    const weights = {
      precision: 0.3,
      ranking: 0.25,
      diversity: 0.2,
      coverage: 0.15,
      novelty: 0.1
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    // Calculate precision score
    if (metrics.precision && benchmarks.precision_at_k) {
      const precisionScore = this.calculateCategoryScore(metrics.precision, benchmarks.precision_at_k);
      totalScore += precisionScore * weights.precision;
      totalWeight += weights.precision;
    }
    
    // Calculate ranking score
    if (metrics.ranking && benchmarks.ndcg) {
      const rankingScore = this.calculateCategoryScore(metrics.ranking, benchmarks.ndcg);
      totalScore += rankingScore * weights.ranking;
      totalWeight += weights.ranking;
    }
    
    // Add other categories...
    
    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }
  
  calculateCategoryScore(actualMetrics, benchmarkMetrics) {
    let totalScore = 0;
    let metricCount = 0;
    
    Object.keys(benchmarkMetrics).forEach(key => {
      if (actualMetrics[key] !== undefined) {
        const score = Math.min(actualMetrics[key] / benchmarkMetrics[key], 1);
        totalScore += score;
        metricCount++;
      }
    });
    
    return metricCount > 0 ? totalScore / metricCount : 0;
  }
  
  analyzeTrends() {
    if (this.historicalData.length < 2) {
      return { message: 'Insufficient historical data for trend analysis' };
    }
    
    const recent = this.historicalData.slice(-5); // Last 5 measurements
    const trends = {};
    
    // Analyze precision trends
    const precisionTrend = this.calculateTrend(
      recent.map(m => m.precision?.precision_at_10 || 0)
    );
    trends.precision_trend = precisionTrend > 0.01 ? 'improving' : 
                           precisionTrend < -0.01 ? 'declining' : 'stable';
    
    // Analyze diversity trends
    const diversityTrend = this.calculateTrend(
      recent.map(m => m.diversity?.intra_list_diversity || 0)
    );
    trends.diversity_trend = diversityTrend > 0.01 ? 'improving' : 
                           diversityTrend < -0.01 ? 'declining' : 'stable';
    
    return trends;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  generateRecommendations(metrics, benchmarks) {
    const recommendations = [];
    
    // Check precision performance
    if (metrics.precision?.precision_at_10 < benchmarks.precision_at_k.k10) {
      recommendations.push({
        category: 'precision',
        issue: 'Precision@10 below target',
        recommendation: 'Consider improving feature engineering or adjusting compatibility scoring weights',
        priority: 'high'
      });
    }
    
    // Check diversity performance
    if (metrics.diversity?.intra_list_diversity < benchmarks.diversity_metrics.intra_list_diversity) {
      recommendations.push({
        category: 'diversity',
        issue: 'Low intra-list diversity',
        recommendation: 'Implement diversity injection techniques or MMR (Maximal Marginal Relevance)',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}

/**
 * BUSINESS IMPACT ANALYZER
 * Tracks user engagement, retention, revenue metrics, and business KPIs
 */
class BusinessImpactAnalyzer extends EventEmitter {
  
  constructor() {
    super();
    this.businessMetrics = {};
    this.revenueMetrics = {};
    this.engagementMetrics = {};
  }
  
  /**
   * Calculate comprehensive business impact metrics
   */
  async calculateBusinessImpact(userData, matchData, revenueData, timeWindow = 30) {
    console.log('Calculating business impact metrics...');
    
    const businessImpact = {
      timestamp: new Date(),
      timeWindow,
      
      // User engagement metrics
      engagement: await this.calculateEngagementMetrics(userData, matchData),
      
      // User retention metrics
      retention: await this.calculateRetentionMetrics(userData),
      
      // Revenue impact metrics
      revenue: await this.calculateRevenueMetrics(revenueData, matchData),
      
      // Conversion funnel metrics
      conversion: await this.calculateConversionMetrics(userData, matchData),
      
      // User satisfaction metrics
      satisfaction: await this.calculateSatisfactionMetrics(userData, matchData),
      
      // Network effects metrics
      networkEffects: await this.calculateNetworkEffects(userData, matchData)
    };
    
    this.businessMetrics = businessImpact;
    this.emit('businessMetricsUpdated', businessImpact);
    
    return businessImpact;
  }
  
  /**
   * Calculate user engagement metrics
   */
  async calculateEngagementMetrics(userData, matchData) {
    const activeUsers = userData.filter(user => user.lastActive >= this.getDateDaysAgo(7));
    const totalUsers = userData.length;
    
    // Session metrics
    const avgSessionsPerUser = this.calculateAverage(userData.map(u => u.sessionsLastWeek || 0));
    const avgSessionDuration = this.calculateAverage(userData.map(u => u.avgSessionDuration || 0));
    
    // Interaction metrics
    const totalSwipes = userData.reduce((sum, user) => sum + (user.swipesLastWeek || 0), 0);
    const totalMessages = matchData.reduce((sum, match) => sum + (match.messageCount || 0), 0);
    
    return {
      // Activity metrics
      weekly_active_users: activeUsers.length,
      weekly_active_rate: activeUsers.length / totalUsers,
      daily_active_users: userData.filter(user => 
        user.lastActive >= this.getDateDaysAgo(1)
      ).length,
      
      // Session metrics
      avg_sessions_per_user: avgSessionsPerUser,
      avg_session_duration_minutes: avgSessionDuration,
      total_sessions: userData.reduce((sum, user) => sum + (user.sessionsLastWeek || 0), 0),
      
      // Interaction metrics
      total_swipes: totalSwipes,
      avg_swipes_per_user: totalSwipes / totalUsers,
      total_messages: totalMessages,
      avg_messages_per_match: totalMessages / (matchData.length || 1),
      
      // Quality metrics
      message_response_rate: this.calculateMessageResponseRate(matchData),
      conversation_length_avg: this.calculateAvgConversationLength(matchData)
    };
  }
  
  /**
   * Calculate user retention metrics
   */
  async calculateRetentionMetrics(userData) {
    const cohortAnalysis = this.performCohortAnalysis(userData);
    
    return {
      // Retention rates
      day_1_retention: this.calculateRetentionRate(userData, 1),
      day_7_retention: this.calculateRetentionRate(userData, 7),
      day_30_retention: this.calculateRetentionRate(userData, 30),
      day_90_retention: this.calculateRetentionRate(userData, 90),
      
      // Churn analysis
      monthly_churn_rate: this.calculateChurnRate(userData, 30),
      churn_prediction_accuracy: this.evaluateChurnPredictions(userData),
      
      // Cohort analysis
      cohort_retention_curves: cohortAnalysis,
      
      // User lifecycle metrics
      avg_user_lifetime_days: this.calculateAvgUserLifetime(userData),
      user_lifecycle_stages: this.categorizeUsersByLifecycle(userData)
    };
  }
  
  /**
   * Calculate revenue impact metrics
   */
  async calculateRevenueMetrics(revenueData, matchData) {
    const totalRevenue = revenueData.reduce((sum, record) => sum + record.amount, 0);
    const payingUsers = new Set(revenueData.map(r => r.userId)).size;
    
    return {
      // Revenue metrics
      total_revenue: totalRevenue,
      monthly_recurring_revenue: this.calculateMRR(revenueData),
      average_revenue_per_user: totalRevenue / (payingUsers || 1),
      customer_lifetime_value: this.calculateCLV(revenueData),
      
      // Conversion metrics
      freemium_to_premium_rate: this.calculateConversionRate(revenueData, 'freemium_to_premium'),
      subscription_renewal_rate: this.calculateRenewalRate(revenueData),
      
      // Premium feature usage
      premium_feature_usage: this.analyzePremiumFeatureUsage(revenueData, matchData),
      
      // Revenue attribution
      matching_driven_revenue: this.calculateMatchingDrivenRevenue(revenueData, matchData)
    };
  }
  
  /**
   * Helper methods for business metrics
   */
  
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
  
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
  
  calculateRetentionRate(userData, days) {
    const cutoffDate = this.getDateDaysAgo(days);
    const eligibleUsers = userData.filter(user => 
      new Date(user.createdAt) <= cutoffDate
    );
    
    if (eligibleUsers.length === 0) return 0;
    
    const retainedUsers = eligibleUsers.filter(user => 
      new Date(user.lastActive) >= cutoffDate
    );
    
    return retainedUsers.length / eligibleUsers.length;
  }
  
  calculateChurnRate(userData, days) {
    const cutoffDate = this.getDateDaysAgo(days);
    const activeAtStart = userData.filter(user => 
      new Date(user.lastActive) >= this.getDateDaysAgo(days * 2) &&
      new Date(user.lastActive) < cutoffDate
    );
    
    if (activeAtStart.length === 0) return 0;
    
    const stillActive = activeAtStart.filter(user => 
      new Date(user.lastActive) >= cutoffDate
    );
    
    return 1 - (stillActive.length / activeAtStart.length);
  }
  
  performCohortAnalysis(userData) {
    // Group users by signup month
    const cohorts = {};
    
    userData.forEach(user => {
      const signupMonth = new Date(user.createdAt).toISOString().slice(0, 7); // YYYY-MM
      
      if (!cohorts[signupMonth]) {
        cohorts[signupMonth] = [];
      }
      cohorts[signupMonth].push(user);
    });
    
    // Calculate retention for each cohort
    const cohortRetention = {};
    
    Object.entries(cohorts).forEach(([month, cohortUsers]) => {
      const retention = {};
      
      for (let period = 0; period <= 12; period++) {
        const periodDate = new Date(month + '-01');
        periodDate.setMonth(periodDate.getMonth() + period);
        
        const activeInPeriod = cohortUsers.filter(user => 
          new Date(user.lastActive) >= periodDate
        );
        
        retention[`month_${period}`] = activeInPeriod.length / cohortUsers.length;
      }
      
      cohortRetention[month] = retention;
    });
    
    return cohortRetention;
  }
  
  calculateMRR(revenueData) {
    // Calculate Monthly Recurring Revenue
    const monthlySubscriptions = revenueData.filter(record => 
      record.type === 'subscription' && record.billingPeriod === 'monthly'
    );
    
    return monthlySubscriptions.reduce((sum, record) => sum + record.amount, 0);
  }
  
  calculateCLV(revenueData) {
    // Customer Lifetime Value calculation
    const userRevenue = {};
    
    revenueData.forEach(record => {
      if (!userRevenue[record.userId]) {
        userRevenue[record.userId] = {
          totalRevenue: 0,
          firstPurchase: new Date(record.createdAt),
          lastPurchase: new Date(record.createdAt),
          purchaseCount: 0
        };
      }
      
      const user = userRevenue[record.userId];
      user.totalRevenue += record.amount;
      user.purchaseCount++;
      
      const purchaseDate = new Date(record.createdAt);
      if (purchaseDate < user.firstPurchase) user.firstPurchase = purchaseDate;
      if (purchaseDate > user.lastPurchase) user.lastPurchase = purchaseDate;
    });
    
    // Calculate average CLV
    const clvValues = Object.values(userRevenue).map(user => {
      const lifetimeDays = (user.lastPurchase - user.firstPurchase) / (1000 * 60 * 60 * 24);
      const avgDaysBetweenPurchases = lifetimeDays / Math.max(user.purchaseCount - 1, 1);
      const avgPurchaseValue = user.totalRevenue / user.purchaseCount;
      
      // Simple CLV calculation
      return avgPurchaseValue * (365 / Math.max(avgDaysBetweenPurchases, 30));
    });
    
    return this.calculateAverage(clvValues);
  }
  
  /**
   * Generate business impact report
   */
  generateBusinessReport() {
    const metrics = this.businessMetrics;
    
    if (!metrics) {
      return { error: 'No business metrics available' };
    }
    
    return {
      timestamp: new Date(),
      executive_summary: {
        key_metrics: {
          weekly_active_rate: metrics.engagement?.weekly_active_rate,
          month_1_retention: metrics.retention?.day_30_retention,
          monthly_recurring_revenue: metrics.revenue?.monthly_recurring_revenue,
          customer_lifetime_value: metrics.revenue?.customer_lifetime_value
        },
        health_status: this.assessBusinessHealth(metrics),
        growth_trends: this.analyzeGrowthTrends(metrics)
      },
      
      detailed_metrics: metrics,
      
      insights: this.generateBusinessInsights(metrics),
      
      recommendations: this.generateBusinessRecommendations(metrics)
    };
  }
  
  assessBusinessHealth(metrics) {
    let healthScore = 0;
    let factors = 0;
    
    // Engagement health
    if (metrics.engagement?.weekly_active_rate > 0.6) healthScore += 25;
    else if (metrics.engagement?.weekly_active_rate > 0.4) healthScore += 15;
    else healthScore += 5;
    factors++;
    
    // Retention health  
    if (metrics.retention?.day_30_retention > 0.5) healthScore += 25;
    else if (metrics.retention?.day_30_retention > 0.3) healthScore += 15;
    else healthScore += 5;
    factors++;
    
    // Revenue health
    if (metrics.revenue?.monthly_recurring_revenue > 10000) healthScore += 25;
    else if (metrics.revenue?.monthly_recurring_revenue > 5000) healthScore += 15;
    else healthScore += 5;
    factors++;
    
    const finalScore = healthScore / factors;
    
    if (finalScore >= 20) return 'excellent';
    if (finalScore >= 15) return 'good';
    if (finalScore >= 10) return 'fair';
    return 'needs_attention';
  }
}

module.exports = {
  AlgorithmEffectivenessAnalyzer,
  BusinessImpactAnalyzer
};