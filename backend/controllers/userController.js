const User = require('../models/User');
const Match = require('../models/Match');

// @desc    Get all users (for browsing)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      gender, 
      dietaryPreference, 
      minAge, 
      maxAge, 
      distance,
      cookingSkill,
      interests
    } = req.query;

    // Build query
    let query = {
      _id: { $ne: req.user.id },
      isActive: true,
      'verification.email': true,
      'verification.payment': true
    };

    // Filter by user's interested in preferences
    if (req.user.interestedIn !== 'all') {
      if (req.user.interestedIn === 'both') {
        query.gender = { $in: ['male', 'female'] };
      } else {
        query.gender = req.user.interestedIn;
      }
    }

    // Filter by who would be interested in current user
    query.$or = [
      { interestedIn: req.user.gender },
      { interestedIn: 'both' },
      { interestedIn: 'all' }
    ];

    // Additional filters
    if (dietaryPreference) {
      query.dietaryPreference = dietaryPreference;
    }

    if (cookingSkill) {
      query.cookingSkill = cookingSkill;
    }

    if (interests && interests.length > 0) {
      query.interests = { $in: interests.split(',') };
    }

    // Age filter
    if (minAge || maxAge) {
      const currentDate = new Date();
      query.dateOfBirth = {};
      
      if (maxAge) {
        const minDate = new Date(currentDate.getFullYear() - maxAge - 1, currentDate.getMonth(), currentDate.getDate());
        query.dateOfBirth.$gte = minDate;
      }
      
      if (minAge) {
        const maxDate = new Date(currentDate.getFullYear() - minAge, currentDate.getMonth(), currentDate.getDate());
        query.dateOfBirth.$lte = maxDate;
      }
    }

    // Exclude blocked users
    query._id = { $nin: [...req.user.blockedUsers, req.user.id] };

    const users = await User.find(query)
      .select('-password -email -reportedUsers -blockedUsers')
      .limit(50)
      .sort('-lastActive');

    // Filter by distance if location coordinates exist
    let filteredUsers = users;
    if (distance && req.user.location.coordinates) {
      filteredUsers = users.filter(user => {
        if (!user.location.coordinates) return false;
        const dist = calculateDistance(
          req.user.location.coordinates,
          user.location.coordinates
        );
        return dist <= distance;
      });
    }

    res.status(200).json({
      success: true,
      count: filteredUsers.length,
      data: filteredUsers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
};

// @desc    Get single user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -reportedUsers -blockedUsers -subscription.stripeCustomerId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: err.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      bio: req.body.bio,
      whyPlantBased: req.body.whyPlantBased,
      interests: req.body.interests,
      favoriteRestaurants: req.body.favoriteRestaurants,
      cookingSkill: req.body.cookingSkill,
      preferences: req.body.preferences,
      location: req.body.location
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: err.message
    });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const userToBlock = req.params.id;

    if (userToBlock === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.blockedUsers.includes(userToBlock)) {
      user.blockedUsers.push(userToBlock);
      await user.save();
    }

    // Also unmatch if matched
    await Match.findOneAndUpdate(
      {
        users: { $all: [req.user.id, userToBlock] },
        status: 'matched'
      },
      {
        status: 'unmatched',
        unmatchedAt: Date.now(),
        unmatchedBy: req.user.id
      }
    );

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: err.message
    });
  }
};

// @desc    Report a user
// @route   POST /api/users/:id/report
// @access  Private
exports.reportUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reportedUserId = req.params.id;

    if (reportedUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report yourself'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Check if already reported
    const alreadyReported = user.reportedUsers.some(
      report => report.user.toString() === reportedUserId
    );

    if (!alreadyReported) {
      user.reportedUsers.push({
        user: reportedUserId,
        reason: reason
      });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'User reported successfully. Our team will review this report.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error reporting user',
      error: err.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Soft delete - just deactivate
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: err.message
    });
  }
};

// Helper function to calculate distance between coordinates
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

function toRad(deg) {
  return deg * (Math.PI/180);
}