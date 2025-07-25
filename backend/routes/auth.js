const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  logout,
  updatePassword,
  verifyEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('dateOfBirth').isDate(),
  body('gender').isIn(['male', 'female', 'non-binary', 'other']),
  body('interestedIn').isIn(['male', 'female', 'both', 'all']),
  body('dietaryPreference').isIn(['vegan', 'vegetarian']),
  body('yearsBased').isNumeric().custom(value => value >= 0),
  body('bio').trim().isLength({ min: 20, max: 500 }),
  body('whyPlantBased').trim().isLength({ min: 20, max: 300 }),
  body('cookingSkill').isIn(['beginner', 'intermediate', 'advanced', 'chef-level'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updatepassword', protect, updatePasswordValidation, updatePassword);
router.post('/verifyemail/:token', protect, verifyEmail);

module.exports = router;