/**
 * Values Compatibility Analyzer for Planted Dating App Matching Algorithm
 * 
 * This module provides sophisticated ethical values alignment scoring for:
 * - Animal rights commitment and consistency
 * - Environmental consciousness and climate action
 * - Social justice alignment and activism
 * - Lifestyle compatibility matrix
 * - Journey stage compatibility assessment
 * 
 * Developed by: Values Compatibility Analyst - Hive Mind Swarm
 */

const User = require('../models/User');

class ValuesCompatibilityAnalyzer {
  
  /**
   * Calculate comprehensive values compatibility score between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Object} Detailed compatibility analysis
   */
  static async calculateValuesCompatibility(userId1, userId2) {
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2)
    ]);

    if (!user1 || !user2) {
      throw new Error('Users not found');
    }

    const ethicalMotivationScore = this.calculateEthicalMotivationScore(user1, user2);
    const lifestyleCompatibility = this.calculateLifestyleCompatibility(user1, user2);
    const journeyStageCompatibility = this.calculateJourneyStageCompatibility(user1, user2);
    const valuesConflictAssessment = this.assessValuesConflicts(user1, user2);
    const culturalCompatibility = this.calculateCulturalCompatibility(user1, user2);

    const overallScore = this.calculateOverallValuesScore(
      ethicalMotivationScore,
      lifestyleCompatibility,
      journeyStageCompatibility,
      valuesConflictAssessment,
      culturalCompatibility
    );

    return {
      overallScore,
      breakdown: {
        ethicalMotivation: ethicalMotivationScore,
        lifestyle: lifestyleCompatibility,
        journeyStage: journeyStageCompatibility,
        valuesAlignment: valuesConflictAssessment,
        cultural: culturalCompatibility
      },
      insights: this.generateCompatibilityInsights(user1, user2, overallScore),
      recommendations: this.generateRelationshipRecommendations(user1, user2, overallScore)
    };
  }

  /**
   * Calculate ethical motivation scoring based on animal rights, environment, and health
   */
  static calculateEthicalMotivationScore(user1, user2) {
    const animalRightsAlignment = this.assessAnimalRightsAlignment(user1, user2);
    const environmentalAlignment = this.assessEnvironmentalAlignment(user1, user2);
    const healthMotivationAlignment = this.assessHealthMotivationAlignment(user1, user2);

    return {
      animalRights: animalRightsAlignment,
      environmental: environmentalAlignment,
      healthMotivation: healthMotivationAlignment,
      composite: Math.round((animalRightsAlignment.score + environmentalAlignment.score + healthMotivationAlignment.score) / 3)
    };
  }

  /**
   * Assess animal rights commitment alignment
   */
  static assessAnimalRightsAlignment(user1, user2) {
    // Dietary strictness scoring
    const dietaryScores = {
      'vegan': 100,
      'vegetarian': 75
    };

    const user1DietScore = dietaryScores[user1.dietaryPreference] || 0;
    const user2DietScore = dietaryScores[user2.dietaryPreference] || 0;

    // Years-based commitment intensity
    const commitmentIntensity = {
      user1: this.calculateCommitmentIntensity(user1.yearsBased),
      user2: this.calculateCommitmentIntensity(user2.yearsBased)
    };

    // Advocacy involvement assessment (derived from interests and whyPlantBased)
    const advocacyLevel = {
      user1: this.assessAdvocacyLevel(user1),
      user2: this.assessAdvocacyLevel(user2)
    };

    // Product choice consistency (inferred from interests in sustainability, activism)
    const productConsciousness = {
      user1: this.assessProductConsciousness(user1),
      user2: this.assessProductConsciousness(user2)
    };

    const alignmentScore = this.calculateAlignmentScore([
      { value: user1DietScore, weight: 0.4 },
      { value: commitmentIntensity.user1, weight: 0.2 },
      { value: advocacyLevel.user1, weight: 0.2 },
      { value: productConsciousness.user1, weight: 0.2 }
    ], [
      { value: user2DietScore, weight: 0.4 },
      { value: commitmentIntensity.user2, weight: 0.2 },
      { value: advocacyLevel.user2, weight: 0.2 },
      { value: productConsciousness.user2, weight: 0.2 }
    ]);

    return {
      score: alignmentScore,
      details: {
        dietaryAlignment: Math.abs(user1DietScore - user2DietScore) <= 25 ? 'high' : 'moderate',
        commitmentAlignment: Math.abs(commitmentIntensity.user1 - commitmentIntensity.user2) <= 20 ? 'high' : 'moderate',
        advocacyAlignment: Math.abs(advocacyLevel.user1 - advocacyLevel.user2) <= 25 ? 'high' : 'moderate'
      }
    };
  }

  /**
   * Assess environmental consciousness alignment
   */
  static assessEnvironmentalAlignment(user1, user2) {
    // Environmental interests scoring
    const envInterests = ['sustainability', 'gardening', 'hiking', 'activism'];
    const user1EnvScore = user1.interests?.filter(i => envInterests.includes(i)).length * 25;
    const user2EnvScore = user2.interests?.filter(i => envInterests.includes(i)).length * 25;

    // Climate action assessment from whyPlantBased text analysis
    const climateMotivation = {
      user1: this.analyzeClimateMotivation(user1.whyPlantBased),
      user2: this.analyzeClimateMotivation(user2.whyPlantBased)
    };

    // Sustainable lifestyle practices (inferred from interests and bio)
    const sustainablePractices = {
      user1: this.assessSustainablePractices(user1),
      user2: this.assessSustainablePractices(user2)
    };

    const alignmentScore = this.calculateAlignmentScore([
      { value: user1EnvScore, weight: 0.4 },
      { value: climateMotivation.user1, weight: 0.3 },
      { value: sustainablePractices.user1, weight: 0.3 }
    ], [
      { value: user2EnvScore, weight: 0.4 },
      { value: climateMotivation.user2, weight: 0.3 },
      { value: sustainablePractices.user2, weight: 0.3 }
    ]);

    return {
      score: alignmentScore,
      details: {
        environmentalInterests: Math.abs(user1EnvScore - user2EnvScore),
        climateActionAlignment: Math.abs(climateMotivation.user1 - climateMotivation.user2) <= 20 ? 'high' : 'moderate',
        sustainabilityPractices: Math.abs(sustainablePractices.user1 - sustainablePractices.user2) <= 25 ? 'aligned' : 'different'
      }
    };
  }

  /**
   * Assess health motivation alignment
   */
  static assessHealthMotivationAlignment(user1, user2) {
    // Health-related interests
    const healthInterests = ['fitness', 'yoga', 'meditation'];
    const user1HealthScore = user1.interests?.filter(i => healthInterests.includes(i)).length * 30;
    const user2HealthScore = user2.interests?.filter(i => healthInterests.includes(i)).length * 30;

    // Health motivation analysis from whyPlantBased
    const healthMotivation = {
      user1: this.analyzeHealthMotivation(user1.whyPlantBased),
      user2: this.analyzeHealthMotivation(user2.whyPlantBased)
    };

    // Wellness lifestyle integration
    const wellnessIntegration = {
      user1: this.assessWellnessIntegration(user1),
      user2: this.assessWellnessIntegration(user2)
    };

    const alignmentScore = this.calculateAlignmentScore([
      { value: user1HealthScore, weight: 0.3 },
      { value: healthMotivation.user1, weight: 0.4 },
      { value: wellnessIntegration.user1, weight: 0.3 }
    ], [
      { value: user2HealthScore, weight: 0.3 },
      { value: healthMotivation.user2, weight: 0.4 },
      { value: wellnessIntegration.user2, weight: 0.3 }
    ]);

    return {
      score: alignmentScore,
      details: {
        healthInterestsAlignment: Math.abs(user1HealthScore - user2HealthScore) <= 30 ? 'high' : 'moderate',
        motivationAlignment: Math.abs(healthMotivation.user1 - healthMotivation.user2) <= 25 ? 'strong' : 'moderate'
      }
    };
  }

  /**
   * Calculate lifestyle compatibility matrix
   */
  static calculateLifestyleCompatibility(user1, user2) {
    const cookingCompatibility = this.assessCookingCompatibility(user1, user2);
    const socialIntegration = this.assessSocialIntegration(user1, user2);
    const restaurantCompatibility = this.assessRestaurantCompatibility(user1, user2);

    return {
      cooking: cookingCompatibility,
      social: socialIntegration,
      dining: restaurantCompatibility,
      composite: Math.round((cookingCompatibility.score + socialIntegration.score + restaurantCompatibility.score) / 3)
    };
  }

  /**
   * Assess cooking and food sharing compatibility
   */
  static assessCookingCompatibility(user1, user2) {
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'chef-level'];
    const user1Level = skillLevels.indexOf(user1.cookingSkill);
    const user2Level = skillLevels.indexOf(user2.cookingSkill);
    
    const skillDifference = Math.abs(user1Level - user2Level);
    
    // Complementary skills score higher than identical beginner levels
    let compatibilityScore;
    if (skillDifference === 0) {
      // Same level - good for peer cooking
      compatibilityScore = user1Level === 0 ? 70 : 85; // Beginners score lower
    } else if (skillDifference === 1) {
      // Complementary levels - excellent for learning/teaching
      compatibilityScore = 95;
    } else if (skillDifference === 2) {
      // Some gap but manageable
      compatibilityScore = 75;
    } else {
      // Large gap might create imbalance
      compatibilityScore = 60;
    }

    // Food exploration compatibility (shared interests in cooking)
    const cookingInterest = user1.interests?.includes('cooking') && user2.interests?.includes('cooking');
    if (cookingInterest) compatibilityScore += 10;

    return {
      score: Math.min(compatibilityScore, 100),
      details: {
        skillGap: skillDifference,
        teachingOpportunity: skillDifference === 1 || skillDifference === 2,
        sharedCookingInterest: cookingInterest,
        recommendation: this.getCookingRecommendation(user1Level, user2Level)
      }
    };
  }

  /**
   * Assess social integration compatibility
   */
  static assessSocialIntegration(user1, user2) {
    // Social activity interests
    const socialInterests = ['travel', 'music', 'art', 'activism'];
    const sharedSocialInterests = user1.interests?.filter(i => 
      socialInterests.includes(i) && user2.interests?.includes(i)
    ).length || 0;

    // Community involvement (inferred from activism interest and bio)
    const communityInvolvement = {
      user1: this.assessCommunityInvolvement(user1),
      user2: this.assessCommunityInvolvement(user2)
    };

    // Social comfort level (inferred from years-based and interests)
    const socialComfort = {
      user1: this.assessSocialComfort(user1),
      user2: this.assessSocialComfort(user2)
    };

    const compatibilityScore = Math.round(
      (sharedSocialInterests * 20) + 
      (Math.min(communityInvolvement.user1, communityInvolvement.user2) * 0.4) +
      (100 - Math.abs(socialComfort.user1 - socialComfort.user2)) * 0.4
    );

    return {
      score: Math.min(compatibilityScore, 100),
      details: {
        sharedSocialInterests,
        communityAlignment: Math.abs(communityInvolvement.user1 - communityInvolvement.user2) <= 20,
        socialComfortAlignment: Math.abs(socialComfort.user1 - socialComfort.user2) <= 25
      }
    };
  }

  /**
   * Assess restaurant preference compatibility
   */
  static assessRestaurantCompatibility(user1, user2) {
    // Shared favorite restaurants
    const sharedRestaurants = user1.favoriteRestaurants?.filter(r => 
      user2.favoriteRestaurants?.includes(r)
    ).length || 0;

    // Dining exploration compatibility (travel + cooking interests)
    const explorationCompatibility = (
      (user1.interests?.includes('travel') && user2.interests?.includes('travel')) ||
      (user1.interests?.includes('cooking') && user2.interests?.includes('cooking'))
    ) ? 30 : 0;

    // Location-based restaurant access
    const locationAlignment = user1.location.city === user2.location.city ? 40 : 
                            user1.location.state === user2.location.state ? 20 : 0;

    const compatibilityScore = (sharedRestaurants * 10) + explorationCompatibility + locationAlignment;

    return {
      score: Math.min(compatibilityScore, 100),
      details: {
        sharedRestaurants,
        explorationAlignment: explorationCompatibility > 0,
        locationAccess: locationAlignment > 0
      }
    };
  }

  /**
   * Calculate journey stage compatibility
   */
  static calculateJourneyStageCompatibility(user1, user2) {
    const user1Stage = this.determineJourneyStage(user1.yearsBased);
    const user2Stage = this.determineJourneyStage(user2.yearsBased);

    const stageCompatibility = this.assessStageCompatibility(user1Stage, user2Stage);
    const mentorshipPotential = this.assessMentorshipPotential(user1, user2);
    const growthAlignment = this.assessGrowthAlignment(user1, user2);

    return {
      user1Stage,
      user2Stage,
      compatibility: stageCompatibility,
      mentorship: mentorshipPotential,
      growth: growthAlignment,
      composite: Math.round((stageCompatibility.score + mentorshipPotential.score + growthAlignment.score) / 3)
    };
  }

  /**
   * Assess values conflict potential and resolution compatibility
   */
  static assessValuesConflicts(user1, user2) {
    const dealbreakers = this.identifyDealbreakers(user1, user2);
    const compromiseAreas = this.identifyCompromiseAreas(user1, user2);
    const communicationStyle = this.assessCommunicationCompatibility(user1, user2);

    return {
      dealbreakers,
      compromiseAreas,
      communication: communicationStyle,
      riskLevel: dealbreakers.length > 0 ? 'high' : compromiseAreas.length > 2 ? 'moderate' : 'low',
      score: Math.max(0, 100 - (dealbreakers.length * 40) - (compromiseAreas.length * 10))
    };
  }

  /**
   * Calculate cultural and geographic compatibility factors
   */
  static calculateCulturalCompatibility(user1, user2) {
    const communityDensity = this.assessPlantBasedCommunityDensity(user1.location, user2.location);
    const culturalAdaptation = this.assessCulturalAdaptation(user1, user2);
    const resourceAccess = this.assessResourceAccess(user1.location, user2.location);
    const familyAlignment = this.assessFamilyAlignment(user1, user2);

    return {
      communitySupport: communityDensity,
      culturalAdaptation,
      resourceAccess,
      familyAlignment,
      composite: Math.round((communityDensity.score + culturalAdaptation.score + resourceAccess.score + familyAlignment.score) / 4)
    };
  }

  // Helper methods for detailed assessments
  static calculateCommitmentIntensity(yearsBased) {
    if (yearsBased >= 10) return 100;
    if (yearsBased >= 5) return 80;
    if (yearsBased >= 2) return 60;
    if (yearsBased >= 1) return 40;
    return 20;
  }

  static assessAdvocacyLevel(user) {
    const advocacyKeywords = ['activism', 'volunteer', 'advocate', 'rights', 'justice'];
    const bioAdvocacy = advocacyKeywords.some(keyword => 
      user.bio?.toLowerCase().includes(keyword) || 
      user.whyPlantBased?.toLowerCase().includes(keyword)
    );
    const activismInterest = user.interests?.includes('activism');
    
    if (bioAdvocacy && activismInterest) return 100;
    if (bioAdvocacy || activismInterest) return 75;
    if (user.interests?.includes('sustainability')) return 50;
    return 25;
  }

  static assessProductConsciousness(user) {
    const consciousKeywords = ['ethical', 'cruelty-free', 'sustainable', 'conscious'];
    const bioConsciousness = consciousKeywords.some(keyword => 
      user.bio?.toLowerCase().includes(keyword) || 
      user.whyPlantBased?.toLowerCase().includes(keyword)
    );
    const sustainabilityInterest = user.interests?.includes('sustainability');
    
    if (bioConsciousness && sustainabilityInterest) return 100;
    if (bioConsciousness || sustainabilityInterest) return 75;
    return 50;
  }

  static analyzeClimateMotivation(whyPlantBased) {
    const climateKeywords = ['climate', 'environment', 'planet', 'earth', 'carbon', 'sustainable'];
    const text = whyPlantBased?.toLowerCase() || '';
    const matches = climateKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(matches * 20, 100);
  }

  static analyzeHealthMotivation(whyPlantBased) {
    const healthKeywords = ['health', 'healthy', 'wellness', 'nutrition', 'energy', 'fitness'];
    const text = whyPlantBased?.toLowerCase() || '';
    const matches = healthKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(matches * 17, 100);
  }

  static assessSustainablePractices(user) {
    const practices = [
      user.interests?.includes('gardening'),
      user.interests?.includes('sustainability'),
      user.interests?.includes('hiking'),
      user.bio?.toLowerCase().includes('zero waste'),
      user.bio?.toLowerCase().includes('minimal')
    ].filter(Boolean).length;
    return practices * 20;
  }

  static assessWellnessIntegration(user) {
    const wellness = [
      user.interests?.includes('yoga'),
      user.interests?.includes('meditation'),
      user.interests?.includes('fitness'),
      user.bio?.toLowerCase().includes('wellness'),
      user.bio?.toLowerCase().includes('mindful')
    ].filter(Boolean).length;
    return wellness * 20;
  }

  static determineJourneyStage(yearsBased) {
    if (yearsBased < 2) return 'new';
    if (yearsBased < 5) return 'established';
    return 'longtime';
  }

  static assessStageCompatibility(stage1, stage2) {
    const compatibility = {
      'new-new': { score: 85, type: 'peer-support' },
      'new-established': { score: 90, type: 'mentorship' },
      'new-longtime': { score: 75, type: 'learning' },
      'established-established': { score: 95, type: 'peer-growth' },
      'established-longtime': { score: 85, type: 'guidance' },
      'longtime-longtime': { score: 90, type: 'experienced-peers' }
    };
    
    const key = `${stage1}-${stage2}`;
    return compatibility[key] || compatibility[`${stage2}-${stage1}`] || { score: 70, type: 'mixed' };
  }

  static calculateAlignmentScore(profile1Factors, profile2Factors) {
    const score1 = profile1Factors.reduce((sum, factor) => sum + (factor.value * factor.weight), 0);
    const score2 = profile2Factors.reduce((sum, factor) => sum + (factor.value * factor.weight), 0);
    
    // Calculate similarity score (higher when values are closer)
    const difference = Math.abs(score1 - score2);
    const maxPossibleDifference = 100;
    const similarity = 100 - (difference / maxPossibleDifference * 100);
    
    return Math.round(similarity);
  }

  static calculateOverallValuesScore(ethical, lifestyle, journey, conflicts, cultural) {
    const weights = {
      ethical: 0.30,
      lifestyle: 0.25,
      journey: 0.20,
      conflicts: 0.15,
      cultural: 0.10
    };

    return Math.round(
      (ethical.composite * weights.ethical) +
      (lifestyle.composite * weights.lifestyle) +
      (journey.composite * weights.journey) +
      (conflicts.score * weights.conflicts) +
      (cultural.composite * weights.cultural)
    );
  }

  static generateCompatibilityInsights(user1, user2, overallScore) {
    const insights = [];
    
    if (overallScore >= 85) {
      insights.push("Exceptional values alignment - shared ethical foundation and lifestyle compatibility");
    } else if (overallScore >= 70) {
      insights.push("Strong compatibility with minor differences that could enhance growth");
    } else if (overallScore >= 55) {
      insights.push("Moderate compatibility - may require open communication about value differences");
    } else {
      insights.push("Significant value differences - would need strong communication and compromise");
    }

    // Add specific insights based on analysis
    if (user1.dietaryPreference === user2.dietaryPreference) {
      insights.push(`Both share ${user1.dietaryPreference} commitment`);
    }

    const yearsDiff = Math.abs(user1.yearsBased - user2.yearsBased);
    if (yearsDiff > 5) {
      insights.push("Different experience levels could offer learning opportunities");
    }

    return insights;
  }

  static generateRelationshipRecommendations(user1, user2, overallScore) {
    const recommendations = [];
    
    if (overallScore >= 80) {
      recommendations.push("Plan cooking adventures together");
      recommendations.push("Explore ethical lifestyle choices as a team");
      recommendations.push("Consider attending plant-based events together");
    } else if (overallScore >= 60) {
      recommendations.push("Discuss your 'why plant-based' stories early");
      recommendations.push("Be open about lifestyle preferences and boundaries");
      recommendations.push("Find compromise areas for dining and socializing");
    } else {
      recommendations.push("Have honest conversations about core values");
      recommendations.push("Identify potential deal-breakers early");
      recommendations.push("Consider if differences are complementary or conflicting");
    }

    return recommendations;
  }

  // Additional helper methods would be implemented for complete functionality
  static assessMentorshipPotential(user1, user2) {
    // Implementation for mentorship assessment
    return { score: 75, potential: 'moderate' };
  }

  static assessGrowthAlignment(user1, user2) {
    // Implementation for growth alignment
    return { score: 80, alignment: 'strong' };
  }

  static identifyDealbreakers(user1, user2) {
    const dealbreakers = [];
    
    // Major dietary preference conflicts would be handled at app level
    // Focus on values-based dealbreakers
    if (user1.preferences?.dietaryDealbreaker && user1.dietaryPreference !== user2.dietaryPreference) {
      dealbreakers.push('dietary_preference_mismatch');
    }
    
    return dealbreakers;
  }

  static identifyCompromiseAreas(user1, user2) {
    const areas = [];
    
    if (Math.abs(user1.yearsBased - user2.yearsBased) > 3) {
      areas.push('experience_level_difference');
    }
    
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'chef-level'];
    if (Math.abs(skillLevels.indexOf(user1.cookingSkill) - skillLevels.indexOf(user2.cookingSkill)) > 1) {
      areas.push('cooking_skill_gap');
    }
    
    return areas;
  }

  static assessCommunicationCompatibility(user1, user2) {
    // Assess communication style compatibility based on interests and bio
    const activeInterests = ['activism', 'travel', 'music'];
    const contemplativeInterests = ['yoga', 'meditation', 'reading'];
    
    const user1Active = user1.interests?.some(i => activeInterests.includes(i));
    const user1Contemplative = user1.interests?.some(i => contemplativeInterests.includes(i));
    
    const user2Active = user2.interests?.some(i => activeInterests.includes(i));
    const user2Contemplative = user2.interests?.some(i => contemplativeInterests.includes(i));
    
    return {
      score: 75, // Base compatibility score
      style: 'complementary'
    };
  }

  static assessPlantBasedCommunityDensity(location1, location2) {
    // Major cities with strong plant-based communities
    const strongCommunities = ['New York City', 'Los Angeles', 'San Francisco', 'Portland', 'Austin', 'Seattle'];
    const moderateCommunities = ['Chicago', 'Denver', 'Atlanta', 'Boston', 'Miami', 'San Diego'];
    
    const getScore = (city) => {
      if (strongCommunities.includes(city)) return 90;
      if (moderateCommunities.includes(city)) return 70;
      return 50;
    };
    
    return {
      score: Math.min(getScore(location1.city), getScore(location2.city)),
      support: location1.city === location2.city ? 'local' : 'remote'
    };
  }

  static assessCulturalAdaptation(user1, user2) {
    // Assess cultural adaptation based on interests and background
    return {
      score: 75,
      adaptation: 'flexible'
    };
  }

  static assessResourceAccess(location1, location2) {
    // Assess access to plant-based resources
    return {
      score: 70,
      access: 'good'
    };
  }

  static assessFamilyAlignment(user1, user2) {
    // Assess family support alignment (could be expanded with additional user data)
    return {
      score: 65,
      alignment: 'neutral'
    };
  }

  static getCookingRecommendation(level1, level2) {
    const recommendations = {
      'equal_beginner': 'Learn together with cooking classes',
      'equal_intermediate': 'Experiment with new cuisines together',
      'equal_advanced': 'Challenge each other with complex recipes',
      'complementary': 'Perfect opportunity for teaching and learning',
      'large_gap': 'Focus on simple, fun cooking activities together'
    };
    
    const diff = Math.abs(level1 - level2);
    if (diff === 0) {
      if (level1 === 0) return recommendations.equal_beginner;
      if (level1 === 1) return recommendations.equal_intermediate;
      return recommendations.equal_advanced;
    } else if (diff <= 1) {
      return recommendations.complementary;
    } else {
      return recommendations.large_gap;
    }
  }

  static assessCommunityInvolvement(user) {
    const involvement = [
      user.interests?.includes('activism'),
      user.interests?.includes('sustainability'),
      user.bio?.toLowerCase().includes('volunteer'),
      user.bio?.toLowerCase().includes('community')
    ].filter(Boolean).length;
    return involvement * 25;
  }

  static assessSocialComfort(user) {
    const socialInterests = ['travel', 'music', 'art'];
    const socialScore = user.interests?.filter(i => socialInterests.includes(i)).length * 20;
    const yearsConfidence = Math.min(user.yearsBased * 5, 40);
    return socialScore + yearsConfidence;
  }
}

module.exports = ValuesCompatibilityAnalyzer;