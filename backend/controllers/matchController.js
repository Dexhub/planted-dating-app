const Match = require('../models/Match');
const User = require('../models/User');
const ValuesCompatibilityAnalyzer = require('../utils/valuesCompatibilityAnalyzer');
const ValuesProfile = require('../models/ValuesProfile');
const sendEmail = require('../utils/sendEmail');
const { calculateCompatibility } = require('../services/compatibilityAlgorithm');
const { generateMatches, getPerformanceMetrics } = require('../services/matchingService');

// @desc    Like/Pass on a user
// @route   POST /api/matches/swipe
// @access  Private
exports.swipeUser = async (req, res, next) => {
  try {
    const { userId, action, superLike = false } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot swipe on yourself'
      });
    }

    // Check if users already have a match record
    let match = await Match.findMatchBetweenUsers(currentUserId, userId);

    if (action === 'pass') {
      if (!match) {
        match = await Match.create({
          users: [currentUserId, userId],
          status: 'rejected'
        });
      } else if (match.status === 'pending') {
        match.status = 'rejected';
        await match.save();
      }

      return res.status(200).json({
        success: true,
        matched: false,
        message: 'Passed on user'
      });
    }

    // Handle 'like' action
    if (!match) {
      // Create new match record
      match = await Match.create({
        users: [currentUserId, userId],
        status: 'pending',
        likes: [{
          user: currentUserId,
          superLike: superLike
        }]
      });

      return res.status(200).json({
        success: true,
        matched: false,
        message: superLike ? 'Super liked!' : 'Liked!'
      });
    }

    // Check if other user already liked
    const otherUserLiked = match.hasUserLiked(userId);
    const currentUserAlreadyLiked = match.hasUserLiked(currentUserId);

    if (currentUserAlreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'Already swiped on this user'
      });
    }

    // Add current user's like
    match.likes.push({
      user: currentUserId,
      superLike: superLike
    });

    // If both users liked each other, it's a match!
    if (otherUserLiked) {
      match.status = 'matched';
      match.matchedAt = Date.now();
      
      // Calculate comprehensive compatibility score
      const compatibility = await calculateCompatibility(currentUserId, userId);
      match.compatibilityScore = compatibility.overall;
      match.sharedInterests = await getSharedInterests(currentUserId, userId);
    }

    await match.save();

    // Send notifications if matched
    if (match.status === 'matched') {
      // Get both users
      const [user1, user2] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId)
      ]);

      // Send email notifications
      try {
        await Promise.all([
          sendEmail({
            email: user1.email,
            subject: "It's a Match! 🌱",
            message: `Great news ${user1.firstName}! You matched with ${user2.firstName}. Start a conversation and see where it grows!`
          }),
          sendEmail({
            email: user2.email,
            subject: "It's a Match! 🌱",
            message: `Great news ${user2.firstName}! You matched with ${user1.firstName}. Start a conversation and see where it grows!`
          })
        ]);
      } catch (emailErr) {
        console.error('Email notification error:', emailErr);
      }

      return res.status(200).json({
        success: true,
        matched: true,
        message: "It's a match!",
        matchId: match._id,
        matchedUser: {
          id: userId,
          firstName: user2.firstName,
          photos: user2.photos
        }
      });
    }

    res.status(200).json({
      success: true,
      matched: false,
      message: superLike ? 'Super liked!' : 'Liked!'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error processing swipe',
      error: err.message
    });
  }
};

// @desc    Get user's matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.getUserMatches(req.user.id, 'matched');

    // Format matches to only show the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
      return {
        id: match._id,
        user: otherUser,
        matchedAt: match.matchedAt,
        lastActivity: match.lastActivity,
        compatibilityScore: match.compatibilityScore,
        sharedInterests: match.sharedInterests
      };
    });

    res.status(200).json({
      success: true,
      count: formattedMatches.length,
      data: formattedMatches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching matches',
      error: err.message
    });
  }
};

// @desc    Get users who liked current user
// @route   GET /api/matches/likes
// @access  Private
exports.getLikes = async (req, res, next) => {
  try {
    // Find pending matches where the other user liked current user
    const pendingMatches = await Match.find({
      users: req.user.id,
      status: 'pending',
      'likes.user': { $ne: req.user.id }
    })
    .populate('likes.user', 'firstName lastName photos bio dietaryPreference');

    const likes = pendingMatches.map(match => {
      const like = match.likes.find(l => l.user._id.toString() !== req.user.id);
      return {
        matchId: match._id,
        user: like.user,
        likedAt: like.likedAt,
        superLike: like.superLike
      };
    });

    res.status(200).json({
      success: true,
      count: likes.length,
      data: likes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching likes',
      error: err.message
    });
  }
};

// @desc    Unmatch a user
// @route   DELETE /api/matches/:matchId
// @access  Private
exports.unmatch = async (req, res, next) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user.id,
      status: 'matched'
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    match.status = 'unmatched';
    match.unmatchedAt = Date.now();
    match.unmatchedBy = req.user.id;
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Unmatched successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error unmatching',
      error: err.message
    });
  }
};

// Add new route for getting potential matches
exports.getPotentialMatches = async (req, res, next) => {
  try {
    const { limit = 10, minScore = 50 } = req.query;
    
    const matches = await generateMatches(req.user.id, parseInt(limit), {
      minScore: parseInt(minScore)
    });

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error generating matches',
      error: err.message
    });
  }
};

// Add route for performance metrics
exports.getMatchingMetrics = async (req, res, next) => {
  try {
    const metrics = getPerformanceMetrics();
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics',
      error: err.message
    });
  }
};

// Helper function to get shared interests
async function getSharedInterests(userId1, userId2) {
  const [user1, user2] = await Promise.all([
    User.findById(userId1),
    User.findById(userId2)
  ]);

  return user1.interests.filter(interest => 
    user2.interests.includes(interest)
  );
}

// Helper function to calculate values-based compatibility
async function calculateValuesCompatibility(userId1, userId2) {
  try {
    // Check if both users have values profiles
    const [profile1, profile2] = await Promise.all([
      ValuesProfile.findOne({ userId: userId1 }),
      ValuesProfile.findOne({ userId: userId2 })
    ]);

    // If both have comprehensive values profiles, use sophisticated analysis
    if (profile1 && profile2 && 
        profile1.assessmentStatus.completionPercentage >= 80 && 
        profile2.assessmentStatus.completionPercentage >= 80) {
      
      const valuesAnalysis = await ValuesCompatibilityAnalyzer.calculateValuesCompatibility(userId1, userId2);
      return valuesAnalysis.overallScore;
    }
    
    // If only basic profiles exist, use simplified values assessment
    return await calculateBasicValuesCompatibility(userId1, userId2);
  } catch (error) {
    console.error('Error calculating values compatibility:', error);
    // Fallback to basic compatibility if values analysis fails
    return await calculateBasicValuesCompatibility(userId1, userId2);
  }
}

// Simplified values compatibility for users without full values profiles
async function calculateBasicValuesCompatibility(userId1, userId2) {
  const [user1, user2] = await Promise.all([
    User.findById(userId1),
    User.findById(userId2)
  ]);

  let score = 0;
  
  // Dietary preference alignment (40 points)
  if (user1.dietaryPreference === user2.dietaryPreference) {
    score += 40;
  } else {
    score += 20; // Vegan/vegetarian still compatible
  }

  // Journey stage compatibility (30 points)
  const yearsDiff = Math.abs(user1.yearsBased - user2.yearsBased);
  if (yearsDiff <= 2) score += 30;
  else if (yearsDiff <= 5) score += 20;
  else score += 10;

  // Values-related interests (30 points)
  const valuesInterests = ['activism', 'sustainability', 'gardening'];
  const user1ValuesInterests = user1.interests?.filter(i => valuesInterests.includes(i)).length || 0;
  const user2ValuesInterests = user2.interests?.filter(i => valuesInterests.includes(i)).length || 0;
  
  // Score based on alignment of values-based interests
  const valuesAlignment = Math.min(user1ValuesInterests, user2ValuesInterests) * 10;
  score += valuesAlignment;

  return Math.min(score, 100);
}