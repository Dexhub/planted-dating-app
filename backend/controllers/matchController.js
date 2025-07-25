const Match = require('../models/Match');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

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
      
      // Calculate compatibility score
      match.compatibilityScore = await calculateCompatibility(currentUserId, userId);
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

// Helper function to calculate compatibility score
async function calculateCompatibility(userId1, userId2) {
  const [user1, user2] = await Promise.all([
    User.findById(userId1),
    User.findById(userId2)
  ]);

  let score = 0;
  
  // Same dietary preference (40 points)
  if (user1.dietaryPreference === user2.dietaryPreference) {
    score += 40;
  } else {
    score += 20; // Still compatible as vegan/vegetarian
  }

  // Similar years plant-based (10 points)
  const yearsDiff = Math.abs(user1.yearsBased - user2.yearsBased);
  if (yearsDiff <= 1) score += 10;
  else if (yearsDiff <= 3) score += 5;

  // Location proximity (20 points)
  if (user1.location.city === user2.location.city) {
    score += 20;
  } else if (user1.location.state === user2.location.state) {
    score += 10;
  }

  // Shared interests (20 points max)
  const sharedInterests = user1.interests.filter(interest => 
    user2.interests.includes(interest)
  );
  score += Math.min(sharedInterests.length * 4, 20);

  // Cooking skill compatibility (10 points)
  if (user1.cookingSkill === user2.cookingSkill) {
    score += 10;
  } else {
    // Complementary skills also get points
    const skills = ['beginner', 'intermediate', 'advanced', 'chef-level'];
    const diff = Math.abs(skills.indexOf(user1.cookingSkill) - skills.indexOf(user2.cookingSkill));
    if (diff === 1) score += 5;
  }

  return Math.min(score, 100);
}

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