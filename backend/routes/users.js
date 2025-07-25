const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateProfile,
  blockUser,
  reportUser,
  deleteAccount
} = require('../controllers/userController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes that require verification
router.get('/', verifiedOnly, getUsers);
router.get('/:id', verifiedOnly, getUser);

// Profile management
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

// User interactions
router.post('/:id/block', blockUser);
router.post('/:id/report', reportUser);

module.exports = router;