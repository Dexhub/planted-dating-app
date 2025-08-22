/**
 * High-Performance Matching Service
 * Real-time matching API with <100ms response time
 * Optimized for scalability and performance
 */

const User = require('../models/User');
const Match = require('../models/Match');
const { calculateCompatibility, batchCalculateMatches } = require('./compatibilityAlgorithm');
const Redis = require('redis');

// Initialize Redis for caching and queuing
let redisClient, redisQueue;
try {
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisQueue = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  Promise.all([redisClient.connect(), redisQueue.connect()]);
  
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisQueue.on('error', (err) => console.log('Redis Queue Error', err));
} catch (err) {
  console.warn('Redis not available, running with limited performance:', err.message);
  redisClient = redisQueue = null;
}

class MatchingService {
  constructor() {
    this.performanceMetrics = {
      avgResponseTime: 0,
      totalRequests: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
    
    // Start background processes
    this.startBackgroundProcessing();
  }

  /**
   * Real-time match generation API - Target: <100ms response time
   */
  async generateMatches(userId, limit = 10, options = {}) {
    const startTime = Date.now();
    
    try {
      // Performance optimization: Check cache first
      const cacheKey = `matches:${userId}:${limit}:${JSON.stringify(options)}`;
      let cachedMatches = await this.getCachedMatches(cacheKey);
      
      if (cachedMatches && !options.forceRefresh) {
        this.updateMetrics(startTime, true, false);
        return cachedMatches;
      }

      // Get user preferences and profile
      const currentUser = await User.findById(userId).lean();
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Find potential matches with optimized query
      const potentialMatches = await this.findPotentialMatches(currentUser, options);
      
      // Calculate compatibility scores in parallel (batch processing)
      const matchPromises = potentialMatches.slice(0, Math.min(limit * 3, 50)).map(async (candidate) => {
        try {
          const compatibility = await calculateCompatibility(userId, candidate._id);
          return {
            user: candidate,
            compatibility,
            score: compatibility.overall,
            lastActive: candidate.lastActive
          };
        } catch (error) {
          console.warn(`Compatibility calculation failed for user ${candidate._id}:`, error.message);
          return null;
        }
      });

      // Wait for all compatibility calculations
      const matchResults = (await Promise.all(matchPromises))
        .filter(match => match && match.score >= (options.minScore || 50))
        .sort((a, b) => {
          // Sort by compatibility score, then by recent activity
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.lastActive) - new Date(a.lastActive);
        })
        .slice(0, limit);

      // Format response
      const formattedMatches = matchResults.map(match => ({
        id: match.user._id,
        firstName: match.user.firstName,
        age: this.calculateAge(match.user.dateOfBirth),
        bio: match.user.bio,
        photos: match.user.photos,
        dietaryPreference: match.user.dietaryPreference,
        location: match.user.location,
        interests: match.user.interests,
        compatibilityScore: match.compatibility.overall,
        compatibilityBreakdown: match.compatibility.breakdown,
        insights: match.compatibility.insights,
        confidence: match.compatibility.confidence
      }));

      // Cache results for 30 minutes
      await this.cacheMatches(cacheKey, formattedMatches, 1800);
      
      // Update performance metrics
      this.updateMetrics(startTime, false, false);
      
      return {
        matches: formattedMatches,
        total: formattedMatches.length,
        generatedAt: new Date(),
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      this.updateMetrics(startTime, false, true);
      console.error('Match generation error:', error);
      throw new Error('Failed to generate matches');
    }
  }

  /**
   * Optimized database query for potential matches
   */
  async findPotentialMatches(currentUser, options = {}) {
    const query = {
      _id: { $ne: currentUser._id },
      isActive: true,
      'verification.email': true,
      'subscription.status': 'active'
    };

    // Gender preferences
    if (currentUser.interestedIn !== 'all') {
      if (currentUser.interestedIn === 'both') {
        query.gender = { $in: ['male', 'female'] };
      } else {
        query.gender = currentUser.interestedIn;
      }
    }

    // Mutual interest filter
    query.interestedIn = { 
      $in: [currentUser.gender, 'both', 'all'] 
    };

    // Age range filter
    const userAge = this.calculateAge(currentUser.dateOfBirth);
    query.dateOfBirth = {
      $gte: this.getDateFromAge(currentUser.preferences?.ageRange?.max || 99),
      $lte: this.getDateFromAge(currentUser.preferences?.ageRange?.min || 18)
    };

    // Location filter (if specified)
    if (currentUser.preferences?.distance && currentUser.location?.coordinates) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates
          },
          $maxDistance: currentUser.preferences.distance * 1609.34 // Convert miles to meters
        }
      };
    }

    // Dietary compatibility (if dealbreaker is set)
    if (currentUser.preferences?.dietaryDealbreaker) {
      query.dietaryPreference = currentUser.dietaryPreference;
    }

    // Exclude blocked users and already swiped users
    const blockedUsers = currentUser.blockedUsers || [];
    const existingMatches = await Match.find({
      users: currentUser._id,
      status: { $in: ['matched', 'rejected', 'unmatched'] }
    }).distinct('users');
    
    const excludedUsers = [...blockedUsers, ...existingMatches, currentUser._id];
    query._id = { $nin: excludedUsers };

    // Execute optimized query with indexes
    const potentialMatches = await User.find(query)
      .select('firstName lastName dateOfBirth bio photos dietaryPreference location interests cookingSkill yearsBased whyPlantBased favoriteRestaurants lastActive')
      .sort({ lastActive: -1 })
      .limit(options.maxCandidates || 100)
      .lean(); // Use lean() for better performance

    return potentialMatches;
  }

  /**
   * Batch processing for daily match pre-computation
   */
  async precomputeMatches(options = {}) {
    const batchSize = options.batchSize || 50;
    const startTime = Date.now();
    
    console.log('Starting daily match pre-computation...');
    
    try {
      // Get all active users
      const activeUsers = await User.find({
        isActive: true,
        'subscription.status': 'active',
        'verification.email': true
      })
      .select('_id')
      .lean();

      const userIds = activeUsers.map(user => user._id.toString());
      console.log(`Pre-computing matches for ${userIds.length} active users`);

      // Process in batches to avoid memory issues
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        // Generate matches for each user in the batch
        const batchPromises = batch.map(async (userId) => {
          try {
            const matches = await this.generateMatches(userId, 20, { forceRefresh: true });
            
            // Store pre-computed matches in cache
            await this.cacheMatches(`precomputed:${userId}`, matches.matches, 86400); // 24 hours
            
            return { userId, count: matches.total, success: true };
          } catch (error) {
            console.error(`Pre-computation failed for user ${userId}:`, error.message);
            return { userId, success: false, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const successCount = batchResults.filter(r => r.success).length;
        
        console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(userIds.length / batchSize)}: ${successCount}/${batch.length} successful`);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const duration = Date.now() - startTime;
      console.log(`Match pre-computation completed in ${duration}ms`);
      
      return {
        success: true,
        totalUsers: userIds.length,
        duration,
        completedAt: new Date()
      };

    } catch (error) {
      console.error('Batch pre-computation error:', error);
      throw new Error('Failed to pre-compute matches');
    }
  }

  /**
   * Real-time profile update processing
   */
  async handleProfileUpdate(userId, changedFields = []) {
    try {
      // Invalidate cached matches for this user
      const pattern = `*${userId}*`;
      await this.invalidateCache(pattern);
      
      // Queue recomputation if significant changes
      const significantFields = ['location', 'interests', 'dietaryPreference', 'preferences'];
      const hasSignificantChanges = changedFields.some(field => 
        significantFields.some(sigField => field.includes(sigField))
      );
      
      if (hasSignificantChanges) {
        await this.queueMatchRecomputation(userId);
      }
      
      console.log(`Profile update processed for user ${userId}`);
    } catch (error) {
      console.error('Profile update processing error:', error);
    }
  }

  /**
   * Performance monitoring and analytics
   */
  updateMetrics(startTime, cacheHit, isError) {
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.totalRequests++;
    
    // Update average response time
    this.performanceMetrics.avgResponseTime = 
      (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) 
      / this.performanceMetrics.totalRequests;
    
    // Update cache hit rate
    if (cacheHit) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalRequests - 1) + 100) 
        / this.performanceMetrics.totalRequests;
    } else {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalRequests - 1)) 
        / this.performanceMetrics.totalRequests;
    }
    
    // Update error rate
    if (isError) {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate * (this.performanceMetrics.totalRequests - 1) + 100) 
        / this.performanceMetrics.totalRequests;
    } else {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate * (this.performanceMetrics.totalRequests - 1)) 
        / this.performanceMetrics.totalRequests;
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      avgResponseTime: Math.round(this.performanceMetrics.avgResponseTime),
      cacheHitRate: Math.round(this.performanceMetrics.cacheHitRate * 100) / 100,
      errorRate: Math.round(this.performanceMetrics.errorRate * 100) / 100
    };
  }

  /**
   * Utility functions
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getDateFromAge(age) {
    const today = new Date();
    return new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
  }

  /**
   * Cache management
   */
  async getCachedMatches(key) {
    if (!redisClient) return null;
    
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  }

  async cacheMatches(key, matches, ttl = 3600) {
    if (!redisClient) return;
    
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(matches));
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  }

  async invalidateCache(pattern) {
    if (!redisClient) return;
    
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Background processing queue
   */
  async queueMatchRecomputation(userId) {
    if (!redisQueue) return;
    
    try {
      await redisQueue.lPush('match_recomputation', JSON.stringify({
        userId,
        timestamp: Date.now(),
        priority: 'normal'
      }));
    } catch (error) {
      console.warn('Queue error:', error);
    }
  }

  startBackgroundProcessing() {
    if (!redisQueue) return;
    
    // Process match recomputation queue
    setInterval(async () => {
      try {
        const queueItem = await redisQueue.rPop('match_recomputation');
        if (queueItem) {
          const { userId } = JSON.parse(queueItem);
          await this.generateMatches(userId, 20, { forceRefresh: true });
          console.log(`Background recomputation completed for user ${userId}`);
        }
      } catch (error) {
        console.warn('Background processing error:', error);
      }
    }, 5000); // Process queue every 5 seconds

    // Daily pre-computation (run at 2 AM)
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        await this.precomputeMatches();
      }
    }, 60000); // Check every minute
  }
}

// Export singleton instance
const matchingService = new MatchingService();

module.exports = {
  MatchingService,
  generateMatches: (userId, limit, options) => matchingService.generateMatches(userId, limit, options),
  precomputeMatches: (options) => matchingService.precomputeMatches(options),
  handleProfileUpdate: (userId, changedFields) => matchingService.handleProfileUpdate(userId, changedFields),
  getPerformanceMetrics: () => matchingService.getPerformanceMetrics()
};