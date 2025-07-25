const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dietaryPreference: user.dietaryPreference,
        isFoundingMember: user.isFoundingMember,
        verification: user.verification,
        subscription: user.subscription
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth,
      gender,
      interestedIn,
      dietaryPreference,
      yearsBased,
      location,
      bio,
      whyPlantBased,
      cookingSkill,
      interests
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Count existing users for founding member status
    const userCount = await User.countDocuments();
    const isFoundingMember = userCount < 100;

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      interestedIn,
      dietaryPreference,
      yearsBased,
      location,
      bio,
      whyPlantBased,
      cookingSkill,
      interests,
      isFoundingMember,
      memberNumber: isFoundingMember ? userCount + 1 : null,
      subscription: {
        status: 'pending',
        plan: isFoundingMember ? 'founding' : 'monthly'
      }
    });

    // Send welcome email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Planted - Where Values Meet',
        message: `Hi ${user.firstName},\n\nWelcome to Planted! ${isFoundingMember ? "Congratulations on being one of our founding 100 members!" : ""}\n\nYour journey to finding someone who shares your values starts here.\n\nNext steps:\n1. Complete your profile with photos\n2. Verify your email\n3. Start browsing and matching\n\nWith plant-based love,\nThe Planted Team`
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: err.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

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

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: err.message
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // In production, implement proper email verification with tokens
    // For now, we'll use a simple implementation
    const user = await User.findById(req.user.id);
    
    user.verification.email = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: err.message
    });
  }
};