/**
 * Analytics and Performance Monitoring Service
 * Real-time algorithm performance tracking and A/B testing
 */

const Match = require('../models/Match');
const User = require('../models/User');
const Redis = require('redis');

// Initialize Redis for analytics storage
let redisClient;
try {
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect();
  redisClient.on('error', (err) => console.log('Redis Analytics Error', err));
} catch (err) {
  console.warn('Redis not available for analytics:', err.message);
  redisClient = null;
}

class AnalyticsService {
  constructor() {
    this.metrics = {
      algorithm: {
        avgResponseTime: 0,
        totalCalculations: 0,
        cacheHitRate: 0,
        errorRate: 0
      },
      matching: {
        totalMatches: 0,
        matchSuccessRate: 0,
        avgCompatibilityScore: 0,
        userEngagement: 0
      },
      performance: {
        peakResponseTime: 0,
        avgThroughput: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    };
    
    this.abTests = new Map();
    
    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Track algorithm performance metrics
   */
  trackAlgorithmPerformance(data) {
    const {
      responseTime,
      cacheHit = false,
      error = false,
      userId,
      compatibilityScore
    } = data;

    // Update algorithm metrics
    this.metrics.algorithm.totalCalculations++;
    
    // Update average response time
    this.metrics.algorithm.avgResponseTime = 
      (this.metrics.algorithm.avgResponseTime * (this.metrics.algorithm.totalCalculations - 1) + responseTime) 
      / this.metrics.algorithm.totalCalculations;

    // Update peak response time
    if (responseTime > this.metrics.performance.peakResponseTime) {
      this.metrics.performance.peakResponseTime = responseTime;
    }

    // Update cache hit rate
    if (cacheHit) {
      this.metrics.algorithm.cacheHitRate = 
        (this.metrics.algorithm.cacheHitRate * (this.metrics.algorithm.totalCalculations - 1) + 100) 
        / this.metrics.algorithm.totalCalculations;
    } else {
      this.metrics.algorithm.cacheHitRate = 
        (this.metrics.algorithm.cacheHitRate * (this.metrics.algorithm.totalCalculations - 1)) 
        / this.metrics.algorithm.totalCalculations;
    }

    // Update error rate
    if (error) {
      this.metrics.algorithm.errorRate = 
        (this.metrics.algorithm.errorRate * (this.metrics.algorithm.totalCalculations - 1) + 100) 
        / this.metrics.algorithm.totalCalculations;
    } else {
      this.metrics.algorithm.errorRate = 
        (this.metrics.algorithm.errorRate * (this.metrics.algorithm.totalCalculations - 1)) 
        / this.metrics.algorithm.totalCalculations;
    }

    // Store detailed metrics in Redis
    this.storeDetailedMetrics('algorithm_performance', {
      timestamp: Date.now(),
      userId,
      responseTime,
      cacheHit,
      error,
      compatibilityScore
    });
  }

  /**
   * Track matching success metrics
   */
  async trackMatchingSuccess(data) {
    const {
      userId1,
      userId2,
      compatibilityScore,
      matched = false,
      conversationStarted = false,
      userFeedback = null
    } = data;

    this.metrics.matching.totalMatches++;

    // Update average compatibility score
    this.metrics.matching.avgCompatibilityScore = 
      (this.metrics.matching.avgCompatibilityScore * (this.metrics.matching.totalMatches - 1) + compatibilityScore) 
      / this.metrics.matching.totalMatches;

    // Track successful matches
    if (matched) {
      // Calculate new match success rate
      const totalSuccessfulMatches = await this.getTotalSuccessfulMatches();
      this.metrics.matching.matchSuccessRate = (totalSuccessfulMatches / this.metrics.matching.totalMatches) * 100;
    }

    // Store detailed matching data
    this.storeDetailedMetrics('matching_success', {
      timestamp: Date.now(),
      userId1,
      userId2,
      compatibilityScore,
      matched,
      conversationStarted,
      userFeedback
    });
  }

  /**
   * A/B Testing Infrastructure
   */
  createABTest(testName, variants, trafficSplit = {}) {
    const test = {
      name: testName,
      variants,
      trafficSplit,
      startTime: Date.now(),
      participants: 0,
      results: {},
      active: true
    };

    // Initialize results for each variant
    variants.forEach(variant => {
      test.results[variant] = {
        participants: 0,
        conversions: 0,
        conversionRate: 0,
        avgCompatibilityScore: 0,
        userSatisfaction: 0
      };
    });

    this.abTests.set(testName, test);
    console.log(`A/B Test '${testName}' created with variants: ${variants.join(', ')}`);
    
    return test;
  }

  assignUserToVariant(testName, userId) {
    const test = this.abTests.get(testName);
    if (!test || !test.active) return null;

    // Simple hash-based assignment for consistent user experience
    const hash = this.hashUserId(userId);
    const variants = test.variants;
    const variantIndex = hash % variants.length;
    const assignedVariant = variants[variantIndex];

    // Track participant
    test.participants++;
    test.results[assignedVariant].participants++;

    // Store assignment
    this.storeDetailedMetrics('ab_test_assignment', {
      timestamp: Date.now(),
      testName,
      userId,
      variant: assignedVariant
    });

    return assignedVariant;
  }

  trackABTestConversion(testName, userId, variant, metrics = {}) {
    const test = this.abTests.get(testName);
    if (!test || !test.active) return;

    const variantResults = test.results[variant];
    if (!variantResults) return;

    // Track conversion
    variantResults.conversions++;
    variantResults.conversionRate = (variantResults.conversions / variantResults.participants) * 100;

    // Update metrics
    if (metrics.compatibilityScore) {
      variantResults.avgCompatibilityScore = 
        (variantResults.avgCompatibilityScore * (variantResults.conversions - 1) + metrics.compatibilityScore) 
        / variantResults.conversions;
    }

    if (metrics.userSatisfaction) {
      variantResults.userSatisfaction = 
        (variantResults.userSatisfaction * (variantResults.conversions - 1) + metrics.userSatisfaction) 
        / variantResults.conversions;
    }

    // Store conversion data
    this.storeDetailedMetrics('ab_test_conversion', {
      timestamp: Date.now(),
      testName,
      userId,
      variant,
      metrics
    });
  }

  getABTestResults(testName) {
    const test = this.abTests.get(testName);
    if (!test) return null;

    // Calculate statistical significance
    const results = { ...test };
    results.statisticalSignificance = this.calculateStatisticalSignificance(test);
    results.recommendation = this.generateABTestRecommendation(test);

    return results;
  }

  /**
   * User feedback integration
   */
  async trackUserFeedback(data) {
    const {
      userId,
      matchId,
      rating, // 1-5 stars
      feedback, // text feedback
      type // 'match_quality', 'algorithm_accuracy', etc.
    } = data;

    // Store in database and cache
    await this.storeDetailedMetrics('user_feedback', {
      timestamp: Date.now(),
      userId,
      matchId,
      rating,
      feedback,
      type
    });

    // Update user engagement metrics
    this.updateUserEngagement(userId, rating);

    // Trigger algorithm improvement if low ratings
    if (rating <= 2) {
      await this.triggerAlgorithmImprovement(userId, matchId, feedback);
    }
  }

  async triggerAlgorithmImprovement(userId, matchId, feedback) {
    // Analyze feedback for algorithm adjustments
    const user = await User.findById(userId);
    const match = await Match.findById(matchId).populate('users');
    
    if (user && match) {
      // Store improvement data for later analysis
      await this.storeDetailedMetrics('algorithm_improvement', {
        timestamp: Date.now(),
        userId,
        matchId,
        feedback,
        userProfile: {
          interests: user.interests,
          dietaryPreference: user.dietaryPreference,
          location: user.location
        },
        matchProfile: {
          compatibilityScore: match.compatibilityScore,
          sharedInterests: match.sharedInterests
        }
      });
    }
  }

  /**
   * Performance bottleneck detection
   */
  detectBottlenecks() {
    const bottlenecks = [];

    // Response time bottleneck
    if (this.metrics.algorithm.avgResponseTime > 100) {
      bottlenecks.push({
        type: 'response_time',
        severity: this.metrics.algorithm.avgResponseTime > 200 ? 'critical' : 'warning',
        value: this.metrics.algorithm.avgResponseTime,
        threshold: 100,
        recommendation: 'Consider optimizing database queries and adding more caching'
      });
    }

    // Cache hit rate bottleneck
    if (this.metrics.algorithm.cacheHitRate < 70) {
      bottlenecks.push({
        type: 'cache_hit_rate',
        severity: this.metrics.algorithm.cacheHitRate < 50 ? 'critical' : 'warning',
        value: this.metrics.algorithm.cacheHitRate,
        threshold: 70,
        recommendation: 'Increase cache TTL or improve cache key strategy'
      });
    }

    // Error rate bottleneck
    if (this.metrics.algorithm.errorRate > 1) {
      bottlenecks.push({
        type: 'error_rate',
        severity: this.metrics.algorithm.errorRate > 5 ? 'critical' : 'warning',
        value: this.metrics.algorithm.errorRate,
        threshold: 1,
        recommendation: 'Investigate and fix algorithm errors'
      });
    }

    return bottlenecks;
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(timeframe = '24h') {
    const report = {
      generatedAt: new Date(),
      timeframe,
      summary: {
        totalCalculations: this.metrics.algorithm.totalCalculations,
        avgResponseTime: Math.round(this.metrics.algorithm.avgResponseTime),
        cacheHitRate: Math.round(this.metrics.algorithm.cacheHitRate * 100) / 100,
        errorRate: Math.round(this.metrics.algorithm.errorRate * 100) / 100,
        totalMatches: this.metrics.matching.totalMatches,
        matchSuccessRate: Math.round(this.metrics.matching.matchSuccessRate * 100) / 100,
        avgCompatibilityScore: Math.round(this.metrics.matching.avgCompatibilityScore)
      },
      performance: {
        peakResponseTime: this.metrics.performance.peakResponseTime,
        bottlenecks: this.detectBottlenecks()
      },
      abTests: Array.from(this.abTests.entries()).map(([name, test]) => ({
        name,
        active: test.active,
        participants: test.participants,
        results: test.results
      })),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    if (this.metrics.algorithm.avgResponseTime > 100) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Response Time',
        description: 'Average response time exceeds 100ms target',
        action: 'Implement database indexing and query optimization'
      });
    }

    // Algorithm recommendations
    if (this.metrics.matching.matchSuccessRate < 60) {
      recommendations.push({
        category: 'algorithm',
        priority: 'medium',
        title: 'Improve Match Success Rate',
        description: 'Match success rate is below 60%',
        action: 'Adjust compatibility scoring weights based on user feedback'
      });
    }

    // Caching recommendations
    if (this.metrics.algorithm.cacheHitRate < 70) {
      recommendations.push({
        category: 'caching',
        priority: 'medium',
        title: 'Improve Cache Strategy',
        description: 'Cache hit rate is below optimal',
        action: 'Increase cache TTL and implement predictive caching'
      });
    }

    return recommendations;
  }

  /**
   * Utility functions
   */
  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async getTotalSuccessfulMatches() {
    return await Match.countDocuments({ status: 'matched' });
  }

  updateUserEngagement(userId, rating) {
    // Simple engagement tracking based on ratings
    this.metrics.matching.userEngagement = 
      (this.metrics.matching.userEngagement * 0.9) + (rating * 0.1);
  }

  calculateStatisticalSignificance(test) {
    // Simplified statistical significance calculation
    // In production, use proper statistical libraries
    const variants = Object.keys(test.results);
    if (variants.length !== 2) return null;

    const [variantA, variantB] = variants;
    const dataA = test.results[variantA];
    const dataB = test.results[variantB];

    if (dataA.participants < 30 || dataB.participants < 30) {
      return { significant: false, reason: 'Insufficient sample size' };
    }

    const pValueThreshold = 0.05;
    const zScore = Math.abs(dataA.conversionRate - dataB.conversionRate) / 
                   Math.sqrt((dataA.conversionRate * (100 - dataA.conversionRate) / dataA.participants) + 
                            (dataB.conversionRate * (100 - dataB.conversionRate) / dataB.participants));

    const significant = zScore > 1.96; // 95% confidence level

    return {
      significant,
      zScore,
      confidenceLevel: 95,
      winner: dataA.conversionRate > dataB.conversionRate ? variantA : variantB
    };
  }

  generateABTestRecommendation(test) {
    const significance = this.calculateStatisticalSignificance(test);
    
    if (!significance) {
      return 'Continue test - insufficient data for recommendation';
    }

    if (significance.significant) {
      return `Implement ${significance.winner} - statistically significant improvement detected`;
    } else {
      return 'No significant difference detected - consider running longer or testing different variants';
    }
  }

  async storeDetailedMetrics(type, data) {
    if (!redisClient) return;

    try {
      const key = `analytics:${type}:${Date.now()}`;
      await redisClient.setEx(key, 86400 * 7, JSON.stringify(data)); // Store for 7 days
    } catch (error) {
      console.warn('Analytics storage error:', error);
    }
  }

  startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Generate hourly reports
    setInterval(() => {
      const report = this.generateReport('1h');
      console.log('Hourly Analytics Report:', JSON.stringify(report.summary, null, 2));
    }, 3600000);
  }

  collectSystemMetrics() {
    // Collect memory and CPU usage
    const memoryUsage = process.memoryUsage();
    this.metrics.performance.memoryUsage = memoryUsage.heapUsed / 1024 / 1024; // MB

    // Calculate throughput
    const now = Date.now();
    if (this.lastMetricsTime) {
      const timeDiff = (now - this.lastMetricsTime) / 1000; // seconds
      const requestsDiff = this.metrics.algorithm.totalCalculations - (this.lastRequestCount || 0);
      this.metrics.performance.avgThroughput = requestsDiff / timeDiff;
    }
    
    this.lastMetricsTime = now;
    this.lastRequestCount = this.metrics.algorithm.totalCalculations;
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();

module.exports = {
  AnalyticsService,
  trackAlgorithmPerformance: (data) => analyticsService.trackAlgorithmPerformance(data),
  trackMatchingSuccess: (data) => analyticsService.trackMatchingSuccess(data),
  trackUserFeedback: (data) => analyticsService.trackUserFeedback(data),
  createABTest: (name, variants, split) => analyticsService.createABTest(name, variants, split),
  assignUserToVariant: (test, userId) => analyticsService.assignUserToVariant(test, userId),
  trackABTestConversion: (test, userId, variant, metrics) => analyticsService.trackABTestConversion(test, userId, variant, metrics),
  getABTestResults: (testName) => analyticsService.getABTestResults(testName),
  generateReport: (timeframe) => analyticsService.generateReport(timeframe),
  detectBottlenecks: () => analyticsService.detectBottlenecks()
};