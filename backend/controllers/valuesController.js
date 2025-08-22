/**
 * Values Controller for Enhanced Compatibility Assessment
 * 
 * Handles values profile creation, updates, and compatibility analysis
 * for the Planted dating app's sophisticated matching algorithm.
 */

const ValuesProfile = require('../models/ValuesProfile');
const ValuesCompatibilityAnalyzer = require('../utils/valuesCompatibilityAnalyzer');
const User = require('../models/User');

// @desc    Get user's values profile
// @route   GET /api/values/profile
// @access  Private
exports.getValuesProfile = async (req, res) => {
  try {
    let profile = await ValuesProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      // Create initial profile if doesn't exist
      profile = await ValuesProfile.create({
        userId: req.user.id,
        journeyStage: {
          stage: req.user.yearsBased < 2 ? 'new' : req.user.yearsBased < 5 ? 'established' : 'longtime'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching values profile',
      error: error.message
    });
  }
};

// @desc    Update values profile section
// @route   PUT /api/values/profile/:section
// @access  Private
exports.updateValuesSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    const validSections = ['ethicalMotivations', 'lifestyleFactors', 'journeyStage', 'valuesPreferences', 'culturalContext'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section name'
      });
    }

    let profile = await ValuesProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      profile = new ValuesProfile({ userId: req.user.id });
    }

    // Update the specific section
    profile[section] = { ...profile[section], ...updateData };
    
    // Mark section as completed
    profile.assessmentStatus[section] = true;
    
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile,
      message: `${section} updated successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating values profile',
      error: error.message
    });
  }
};

// @desc    Get values compatibility with another user
// @route   GET /api/values/compatibility/:userId
// @access  Private
exports.getValuesCompatibility = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot analyze compatibility with yourself'
      });
    }

    // Check if both users have values profiles
    const [currentProfile, targetProfile] = await Promise.all([
      ValuesProfile.findOne({ userId: currentUserId }),
      ValuesProfile.findOne({ userId })
    ]);

    if (!currentProfile || !targetProfile) {
      return res.status(400).json({
        success: false,
        message: 'Both users must complete values assessment'
      });
    }

    // Check for cached compatibility score
    let compatibility = currentProfile.getCachedCompatibilityScore(userId);
    
    if (!compatibility) {
      // Calculate new compatibility score
      compatibility = await ValuesCompatibilityAnalyzer.calculateValuesCompatibility(currentUserId, userId);
      
      // Cache the result in both profiles
      currentProfile.cacheCompatibilityScore(userId, compatibility);
      targetProfile.cacheCompatibilityScore(currentUserId, compatibility);
      
      await Promise.all([
        currentProfile.save(),
        targetProfile.save()
      ]);
    }

    res.status(200).json({
      success: true,
      data: compatibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating values compatibility',
      error: error.message
    });
  }
};

// @desc    Get values assessment progress
// @route   GET /api/values/assessment-status
// @access  Private
exports.getAssessmentStatus = async (req, res) => {
  try {
    const profile = await ValuesProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          completionPercentage: 0,
          completedSections: [],
          nextSection: 'ethicalMotivations'
        }
      });
    }

    const completedSections = Object.entries(profile.assessmentStatus)
      .filter(([key, value]) => key !== 'completionPercentage' && value)
      .map(([key]) => key);

    const allSections = ['ethicalMotivations', 'lifestyleFactors', 'journeyStage', 'valuesPreferences', 'culturalContext'];
    const nextSection = allSections.find(section => !completedSections.includes(section));

    res.status(200).json({
      success: true,
      data: {
        completionPercentage: profile.assessmentStatus.completionPercentage,
        completedSections,
        nextSection,
        totalSections: allSections.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment status',
      error: error.message
    });
  }
};

// @desc    Get values-based match suggestions
// @route   GET /api/values/matches
// @access  Private
exports.getValueBasedMatches = async (req, res) => {
  try {
    const { limit = 10, minCompatibility = 70 } = req.query;
    const currentUserId = req.user.id;

    // Get current user's profile
    const currentProfile = await ValuesProfile.findOne({ userId: currentUserId });
    
    if (!currentProfile || currentProfile.assessmentStatus.completionPercentage < 80) {
      return res.status(400).json({
        success: false,
        message: 'Complete your values assessment to get compatibility-based matches'
      });
    }

    // Find other users with completed profiles
    const potentialMatches = await ValuesProfile.findProfilesForAssessment(80);
    
    // Filter out current user and calculate compatibility
    const compatibilityScores = [];
    
    for (const profile of potentialMatches) {
      if (profile.userId._id.toString() === currentUserId) continue;
      
      try {
        const compatibility = await ValuesCompatibilityAnalyzer.calculateValuesCompatibility(
          currentUserId, 
          profile.userId._id.toString()
        );
        
        if (compatibility.overallScore >= minCompatibility) {
          compatibilityScores.push({
            user: profile.userId,
            compatibility
          });
        }
      } catch (error) {
        console.error(`Error calculating compatibility with user ${profile.userId._id}:`, error);
      }
    }

    // Sort by compatibility score and limit results
    compatibilityScores.sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore);
    const topMatches = compatibilityScores.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: topMatches,
      total: compatibilityScores.length,
      message: `Found ${topMatches.length} highly compatible matches`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding values-based matches',
      error: error.message
    });
  }
};

// @desc    Get values insights for profile improvement
// @route   GET /api/values/insights
// @access  Private
exports.getValuesInsights = async (req, res) => {
  try {
    const profile = await ValuesProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Values profile not found'
      });
    }

    const insights = {
      strengthAreas: [],
      improvementAreas: [],
      compatibilityTips: [],
      journeyGuidance: []
    };

    // Analyze completed sections for strengths
    if (profile.assessmentStatus.ethicalMotivations) {
      insights.strengthAreas.push('Clear ethical foundation established');
    }
    
    if (profile.assessmentStatus.lifestyleFactors) {
      insights.strengthAreas.push('Lifestyle preferences well-defined');
    }

    // Identify improvement areas
    const incompleteSections = ['ethicalMotivations', 'lifestyleFactors', 'journeyStage', 'valuesPreferences', 'culturalContext']
      .filter(section => !profile.assessmentStatus[section]);
    
    if (incompleteSections.length > 0) {
      insights.improvementAreas.push(`Complete assessment sections: ${incompleteSections.join(', ')}`);
    }

    // Journey-specific guidance
    if (profile.journeyStage.stage === 'new') {
      insights.journeyGuidance.push('Consider connecting with experienced plant-based individuals');
      insights.journeyGuidance.push('Focus on building cooking skills and nutrition knowledge');
    } else if (profile.journeyStage.stage === 'established') {
      insights.journeyGuidance.push('Great time to explore advocacy or community involvement');
      insights.journeyGuidance.push('Consider mentoring newcomers to the lifestyle');
    } else {
      insights.journeyGuidance.push('Your experience makes you valuable to the community');
      insights.journeyGuidance.push('Consider leadership roles in plant-based advocacy');
    }

    // Compatibility tips based on profile data
    if (profile.lifestyleFactors?.cooking?.experimentation === 'experimental') {
      insights.compatibilityTips.push('Your culinary adventurousness is attractive to food enthusiasts');
    }
    
    if (profile.ethicalMotivations?.animalRights?.advocacyLevel === 'active' || 
        profile.ethicalMotivations?.animalRights?.advocacyLevel === 'leadership') {
      insights.compatibilityTips.push('Your activism shows deep commitment - attractive to value-aligned partners');
    }

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating values insights',
      error: error.message
    });
  }
};

// @desc    Update compatibility preferences
// @route   PUT /api/values/compatibility-preferences
// @access  Private
exports.updateCompatibilityPreferences = async (req, res) => {
  try {
    const { 
      minimumCompatibilityScore = 60,
      dealbreakers = [],
      preferredJourneyStages = [],
      ethicalPriorities = []
    } = req.body;

    let profile = await ValuesProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      profile = new ValuesProfile({ userId: req.user.id });
    }

    // Update compatibility preferences
    profile.valuesPreferences = {
      ...profile.valuesPreferences,
      dealbreakers,
      minimumCompatibilityScore,
      preferredJourneyStages,
      ethicalPriorities
    };

    profile.assessmentStatus.valuesPreferences = true;
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.valuesPreferences,
      message: 'Compatibility preferences updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating compatibility preferences',
      error: error.message
    });
  }
};

// @desc    Get detailed compatibility breakdown with specific user
// @route   GET /api/values/detailed-compatibility/:userId
// @access  Private
exports.getDetailedCompatibility = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const compatibility = await ValuesCompatibilityAnalyzer.calculateValuesCompatibility(currentUserId, userId);
    
    // Get both users' basic info for context
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select('firstName dietaryPreference yearsBased interests'),
      User.findById(userId).select('firstName dietaryPreference yearsBased interests')
    ]);

    const detailedAnalysis = {
      compatibility,
      userContext: {
        current: currentUser,
        target: targetUser
      },
      analysisDate: new Date(),
      recommendations: {
        conversationStarters: generateConversationStarters(compatibility),
        relationshipTips: generateRelationshipTips(compatibility),
        potentialChallenges: identifyPotentialChallenges(compatibility)
      }
    };

    res.status(200).json({
      success: true,
      data: detailedAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating detailed compatibility analysis',
      error: error.message
    });
  }
};

// Helper functions for detailed compatibility analysis
function generateConversationStarters(compatibility) {
  const starters = [];
  
  if (compatibility.breakdown.ethicalMotivation.composite > 80) {
    starters.push("What first inspired you to choose a plant-based lifestyle?");
    starters.push("Do you have a favorite plant-based recipe you'd love to share?");
  }
  
  if (compatibility.breakdown.lifestyle.composite > 75) {
    starters.push("What's your favorite plant-based restaurant in the area?");
    starters.push("Have you tried any interesting plant-based products lately?");
  }
  
  return starters;
}

function generateRelationshipTips(compatibility) {
  const tips = [];
  
  if (compatibility.overallScore > 85) {
    tips.push("Your values align strongly - focus on building emotional connection");
    tips.push("Plan plant-based adventures together to strengthen your bond");
  } else if (compatibility.overallScore > 70) {
    tips.push("Discuss your plant-based journeys to understand differences");
    tips.push("Find compromise areas where you can grow together");
  }
  
  return tips;
}

function identifyPotentialChallenges(compatibility) {
  const challenges = [];
  
  if (compatibility.breakdown.journeyStage.composite < 70) {
    challenges.push("Different experience levels - be patient with learning curves");
  }
  
  if (compatibility.breakdown.valuesAlignment.score < 60) {
    challenges.push("Some value differences - open communication will be key");
  }
  
  return challenges;
}

module.exports = {
  getValuesProfile,
  updateValuesSection,
  getValuesCompatibility,
  getAssessmentStatus,
  getValueBasedMatches,
  getValuesInsights,
  updateCompatibilityPreferences,
  getDetailedCompatibility
};