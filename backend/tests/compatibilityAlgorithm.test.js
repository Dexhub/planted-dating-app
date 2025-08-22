/**
 * Compatibility Algorithm Test Suite
 * Tests the multi-dimensional scoring engine
 */

const { calculateCompatibility, ALGORITHM_WEIGHTS } = require('../services/compatibilityAlgorithm');
const User = require('../models/User');
const mongoose = require('mongoose');

// Mock Redis to avoid dependency in tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn()
  }))
}));

describe('Compatibility Algorithm', () => {
  let user1, user2;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/planted_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});

    // Create test users
    user1 = await User.create({
      email: 'user1@test.com',
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Green',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'female',
      interestedIn: 'male',
      dietaryPreference: 'vegan',
      yearsBased: 5,
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        coordinates: [-122.4194, 37.7749]
      },
      bio: 'Passionate about sustainable living and animal rights',
      whyPlantBased: 'I chose veganism for ethical reasons - to reduce animal suffering and environmental impact',
      interests: ['cooking', 'hiking', 'sustainability', 'yoga'],
      cookingSkill: 'intermediate',
      favoriteRestaurants: ['Greens Restaurant', 'Loving Hut'],
      preferences: {
        ageRange: { min: 25, max: 35 },
        distance: 50,
        dietaryDealbreaker: true
      }
    });

    user2 = await User.create({
      email: 'user2@test.com',
      password: 'password123',
      firstName: 'Bob',
      lastName: 'Earth',
      dateOfBirth: new Date('1992-08-20'),
      gender: 'male',
      interestedIn: 'female',
      dietaryPreference: 'vegan',
      yearsBased: 3,
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        coordinates: [-122.4094, 37.7849]
      },
      bio: 'Environmental activist and plant-based chef',
      whyPlantBased: 'Veganism aligns with my values of compassion and environmental stewardship',
      interests: ['cooking', 'activism', 'hiking', 'gardening'],
      cookingSkill: 'advanced',
      favoriteRestaurants: ['Greens Restaurant', 'Shizen'],
      preferences: {
        ageRange: { min: 22, max: 32 },
        distance: 75,
        dietaryDealbreaker: true
      }
    });
  });

  describe('calculateCompatibility', () => {
    test('should calculate high compatibility for very similar users', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);

      expect(result).toBeDefined();
      expect(result.overall).toBeGreaterThan(80);
      expect(result.breakdown).toBeDefined();
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    test('should have proper breakdown structure', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);

      expect(result.breakdown).toHaveProperty('lifestyleAlignment');
      expect(result.breakdown).toHaveProperty('valuesCompatibility');
      expect(result.breakdown).toHaveProperty('lifestyleIntegration');
      expect(result.breakdown).toHaveProperty('communicationStyle');
      expect(result.breakdown).toHaveProperty('personalCompatibility');

      // All scores should be between 0-100
      Object.values(result.breakdown).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    test('should penalize different dietary preferences', async () => {
      // Change user2 to vegetarian
      await User.findByIdAndUpdate(user2._id, { dietaryPreference: 'vegetarian' });
      
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Should still be compatible but with lower lifestyle alignment
      expect(result.overall).toBeGreaterThan(60);
      expect(result.breakdown.lifestyleAlignment).toBeLessThan(90);
    });

    test('should reward same location', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Users in same city should have high lifestyle integration
      expect(result.breakdown.lifestyleIntegration).toBeGreaterThan(70);
      expect(result.insights.some(insight => insight.includes('same city'))).toBe(true);
    });

    test('should handle users with different cooking skills', async () => {
      // Set very different cooking skills
      await User.findByIdAndUpdate(user1._id, { cookingSkill: 'beginner' });
      await User.findByIdAndUpdate(user2._id, { cookingSkill: 'chef-level' });
      
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Should still be reasonable but with different scoring
      expect(result.overall).toBeGreaterThan(50);
      expect(result.breakdown.lifestyleAlignment).toBeLessThan(85);
    });

    test('should reward shared interests', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Users share cooking and hiking interests
      expect(result.breakdown.valuesCompatibility).toBeGreaterThan(60);
      expect(result.insights.some(insight => insight.includes('interests'))).toBe(true);
    });

    test('should calculate confidence based on data completeness', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Both users have complete profiles
      expect(result.confidence).toBeGreaterThan(80);
      
      // Test with incomplete profile
      await User.findByIdAndUpdate(user2._id, { 
        bio: '', 
        whyPlantBased: '',
        interests: [],
        favoriteRestaurants: []
      });
      
      const resultIncomplete = await calculateCompatibility(user1._id, user2._id);
      expect(resultIncomplete.confidence).toBeLessThan(result.confidence);
    });

    test('should handle missing users gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(calculateCompatibility(user1._id, nonExistentId))
        .rejects.toThrow('Failed to calculate compatibility');
    });

    test('should generate meaningful insights', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);
      
      expect(result.insights).toContain(expect.stringContaining('vegan'));
      expect(result.insights.length).toBeGreaterThan(2);
      
      // Insights should be relevant to the users' profiles
      const insightsText = result.insights.join(' ').toLowerCase();
      expect(insightsText).toContain('compatibility');
    });

    test('should respect algorithm weights', async () => {
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // Lifestyle alignment should have highest weight (35%)
      // So it should significantly impact overall score
      const lifestyleContribution = result.breakdown.lifestyleAlignment * 0.35;
      const expectedMinimum = lifestyleContribution * 0.8; // At least 80% of lifestyle contribution
      
      expect(result.overall).toBeGreaterThan(expectedMinimum);
    });

    test('should perform within 100ms for cached results', async () => {
      // First call to populate cache
      await calculateCompatibility(user1._id, user2._id);
      
      // Second call should be faster due to caching
      const startTime = Date.now();
      await calculateCompatibility(user1._id, user2._id);
      const duration = Date.now() - startTime;
      
      // Should be very fast with caching
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Age Compatibility', () => {
    test('should handle age preferences correctly', async () => {
      // Set narrow age preference for user1
      await User.findByIdAndUpdate(user1._id, {
        preferences: { ageRange: { min: 30, max: 35 } }
      });
      
      const result = await calculateCompatibility(user1._id, user2._id);
      
      // User2 is 31, which is in range for user1 but user1 is 28, out of range for user2
      expect(result.breakdown.lifestyleIntegration).toBeLessThan(80);
    });
  });

  describe('Text Analysis', () => {
    test('should analyze text similarity in whyPlantBased', async () => {
      // Create users with very similar reasons
      await User.findByIdAndUpdate(user1._id, {
        whyPlantBased: 'I love animals and want to protect the environment'
      });
      await User.findByIdAndUpdate(user2._id, {
        whyPlantBased: 'Animal welfare and environmental protection are my main motivations'
      });
      
      const result = await calculateCompatibility(user1._id, user2._id);
      
      expect(result.breakdown.valuesCompatibility).toBeGreaterThan(70);
    });
  });

  describe('Performance', () => {
    test('should complete calculation within performance target', async () => {
      const startTime = Date.now();
      await calculateCompatibility(user1._id, user2._id);
      const duration = Date.now() - startTime;
      
      // Should complete within 100ms for new calculation
      expect(duration).toBeLessThan(200);
    });
  });
});