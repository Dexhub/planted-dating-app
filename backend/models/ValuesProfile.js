/**
 * Values Profile Model for Enhanced Compatibility Matching
 * 
 * This model extends user data with detailed values and lifestyle information
 * for sophisticated compatibility analysis in the Planted dating app.
 */

const mongoose = require('mongoose');

const valuesProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Ethical Motivations (0-100 scales)
  ethicalMotivations: {
    animalRights: {
      primaryMotivation: {
        type: Boolean,
        default: false
      },
      advocacyLevel: {
        type: String,
        enum: ['passive', 'moderate', 'active', 'leadership'],
        default: 'passive'
      },
      productConsciousness: {
        cosmetics: {
          type: String,
          enum: ['not-considered', 'sometimes', 'always', 'research-first'],
          default: 'not-considered'
        },
        clothing: {
          type: String,
          enum: ['not-considered', 'sometimes', 'always', 'research-first'],
          default: 'not-considered'
        },
        household: {
          type: String,
          enum: ['not-considered', 'sometimes', 'always', 'research-first'],
          default: 'not-considered'
        }
      }
    },
    
    environmental: {
      primaryMotivation: {
        type: Boolean,
        default: false
      },
      carbonFootprintAwareness: {
        type: String,
        enum: ['unaware', 'aware', 'tracking', 'optimizing'],
        default: 'unaware'
      },
      sustainableLiving: {
        type: String,
        enum: ['minimal', 'moderate', 'committed', 'zealous'],
        default: 'minimal'
      },
      climateActivism: {
        type: String,
        enum: ['none', 'occasional', 'regular', 'leadership'],
        default: 'none'
      }
    },
    
    health: {
      primaryMotivation: {
        type: Boolean,
        default: false
      },
      nutritionKnowledge: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'expert'],
        default: 'basic'
      },
      wellnessIntegration: {
        type: String,
        enum: ['minimal', 'moderate', 'high', 'lifestyle'],
        default: 'minimal'
      }
    }
  },

  // Lifestyle Compatibility Factors
  lifestyleFactors: {
    cooking: {
      frequency: {
        type: String,
        enum: ['rarely', 'occasionally', 'regularly', 'daily'],
        default: 'occasionally'
      },
      experimentation: {
        type: String,
        enum: ['conservative', 'moderate', 'adventurous', 'experimental'],
        default: 'moderate'
      },
      sharing: {
        type: Boolean,
        default: true
      },
      teaching: {
        type: Boolean,
        default: false
      },
      learning: {
        type: Boolean,
        default: true
      }
    },
    
    socialDining: {
      mixedGroupComfort: {
        type: String,
        enum: ['uncomfortable', 'manageable', 'comfortable', 'advocate'],
        default: 'manageable'
      },
      plantBasedOnlyPreference: {
        type: Boolean,
        default: false
      },
      restaurantAdventure: {
        type: String,
        enum: ['routine', 'occasional', 'frequent', 'constant'],
        default: 'occasional'
      }
    },
    
    socialIntegration: {
      familySupport: {
        type: String,
        enum: ['unsupportive', 'neutral', 'supportive', 'enthusiastic'],
        default: 'neutral'
      },
      friendGroupAlignment: {
        type: String,
        enum: ['conflicting', 'mixed', 'accepting', 'aligned'],
        default: 'mixed'
      },
      professionalConsiderations: {
        type: String,
        enum: ['hidden', 'private', 'open', 'advocacy'],
        default: 'private'
      },
      communityInvolvement: {
        type: String,
        enum: ['none', 'observer', 'participant', 'organizer'],
        default: 'none'
      }
    }
  },

  // Journey Stage Details
  journeyStage: {
    stage: {
      type: String,
      enum: ['new', 'established', 'longtime'],
      required: true
    },
    confidence: {
      type: String,
      enum: ['questioning', 'growing', 'confident', 'unwavering'],
      default: 'growing'
    },
    challenges: [{
      type: String,
      enum: ['social-pressure', 'nutrition-concerns', 'convenience', 'cost', 'variety', 'family-resistance']
    }],
    goals: [{
      type: String,
      enum: ['health-improvement', 'ethical-consistency', 'environmental-impact', 'community-building', 'advocacy', 'education']
    }],
    mentorshipInterest: {
      offering: {
        type: Boolean,
        default: false
      },
      seeking: {
        type: Boolean,
        default: false
      }
    }
  },

  // Values Dealbreakers and Preferences
  valuesPreferences: {
    dealbreakers: [{
      type: String,
      enum: ['dietary-inconsistency', 'non-ethical-products', 'environmental-disregard', 'social-pressure-conformity', 'anti-activism']
    }],
    compromiseAreas: [{
      type: String,
      enum: ['experience-levels', 'cooking-skills', 'social-situations', 'family-dynamics', 'activism-involvement']
    }],
    growthAreas: [{
      type: String,
      enum: ['cooking-skills', 'nutrition-knowledge', 'activism', 'community-involvement', 'product-consciousness']
    }],
    communicationStyle: {
      type: String,
      enum: ['direct', 'diplomatic', 'encouraging', 'educational'],
      default: 'diplomatic'
    },
    conflictResolution: {
      type: String,
      enum: ['avoidant', 'compromising', 'collaborative', 'assertive'],
      default: 'compromising'
    }
  },

  // Cultural and Geographic Context
  culturalContext: {
    culturalBackground: {
      plantBasedTraditions: {
        type: Boolean,
        default: false
      },
      familyFoodTraditions: {
        type: String,
        enum: ['conflicting', 'adaptable', 'supportive', 'aligned'],
        default: 'adaptable'
      },
      religiousConsiderations: {
        type: String,
        enum: ['none', 'supportive', 'neutral', 'conflicting'],
        default: 'none'
      }
    },
    
    geographicFactors: {
      communityDensity: {
        type: String,
        enum: ['isolated', 'sparse', 'moderate', 'abundant'],
        default: 'moderate'
      },
      resourceAccess: {
        type: String,
        enum: ['limited', 'moderate', 'good', 'excellent'],
        default: 'moderate'
      },
      socialAcceptance: {
        type: String,
        enum: ['challenging', 'mixed', 'accepting', 'embracing'],
        default: 'mixed'
      }
    }
  },

  // Compatibility Scores Cache
  compatibilityCache: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    scores: [{
      withUserId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      overallScore: {
        type: Number,
        min: 0,
        max: 100
      },
      breakdown: {
        ethicalAlignment: Number,
        lifestyleCompatibility: Number,
        journeyStageMatch: Number,
        valuesConflictRisk: Number,
        culturalCompatibility: Number
      },
      insights: [String],
      recommendations: [String],
      calculatedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Assessment Completion Tracking
  assessmentStatus: {
    ethicalMotivations: {
      type: Boolean,
      default: false
    },
    lifestyleFactors: {
      type: Boolean,
      default: false
    },
    journeyStage: {
      type: Boolean,
      default: false
    },
    valuesPreferences: {
      type: Boolean,
      default: false
    },
    culturalContext: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
valuesProfileSchema.index({ userId: 1 });
valuesProfileSchema.index({ 'assessmentStatus.completionPercentage': -1 });
valuesProfileSchema.index({ 'journeyStage.stage': 1 });
valuesProfileSchema.index({ 'compatibilityCache.scores.withUserId': 1 });

// Middleware to update the updatedAt field
valuesProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateCompletionPercentage();
  next();
});

// Method to calculate assessment completion percentage
valuesProfileSchema.methods.calculateCompletionPercentage = function() {
  const sections = [
    this.assessmentStatus.ethicalMotivations,
    this.assessmentStatus.lifestyleFactors,
    this.assessmentStatus.journeyStage,
    this.assessmentStatus.valuesPreferences,
    this.assessmentStatus.culturalContext
  ];
  
  const completed = sections.filter(Boolean).length;
  this.assessmentStatus.completionPercentage = Math.round((completed / sections.length) * 100);
};

// Method to get cached compatibility score
valuesProfileSchema.methods.getCachedCompatibilityScore = function(userId) {
  const cached = this.compatibilityCache.scores.find(
    score => score.withUserId.toString() === userId.toString()
  );
  
  // Return cached score if it's less than 24 hours old
  if (cached && (Date.now() - cached.calculatedAt) < 24 * 60 * 60 * 1000) {
    return cached;
  }
  
  return null;
};

// Method to cache compatibility score
valuesProfileSchema.methods.cacheCompatibilityScore = function(userId, scoreData) {
  // Remove existing cache for this user
  this.compatibilityCache.scores = this.compatibilityCache.scores.filter(
    score => score.withUserId.toString() !== userId.toString()
  );
  
  // Add new cache entry
  this.compatibilityCache.scores.push({
    withUserId: userId,
    ...scoreData,
    calculatedAt: new Date()
  });
  
  // Keep only the 50 most recent scores
  if (this.compatibilityCache.scores.length > 50) {
    this.compatibilityCache.scores.sort((a, b) => b.calculatedAt - a.calculatedAt);
    this.compatibilityCache.scores = this.compatibilityCache.scores.slice(0, 50);
  }
  
  this.compatibilityCache.lastUpdated = new Date();
};

// Static method to find profiles ready for assessment
valuesProfileSchema.statics.findProfilesForAssessment = function(minCompletion = 80) {
  return this.find({
    'assessmentStatus.completionPercentage': { $gte: minCompletion }
  }).populate('userId', 'firstName lastName email');
};

// Static method to find profiles needing compatibility updates
valuesProfileSchema.statics.findProfilesNeedingCompatibilityUpdate = function() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.find({
    $or: [
      { 'compatibilityCache.lastUpdated': { $lt: yesterday } },
      { 'compatibilityCache.lastUpdated': { $exists: false } }
    ]
  }).populate('userId', 'firstName lastName email');
};

module.exports = mongoose.model('ValuesProfile', valuesProfileSchema);