const express = require('express');
const router = express.Router();
const {
  swipeUser,
  getMatches,
  getLikes,
  unmatch
} = require('../controllers/matchController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication and verification
router.use(protect);
router.use(verifiedOnly);

router.post('/swipe', swipeUser);
router.get('/', getMatches);
router.get('/likes', getLikes);
router.delete('/:matchId', unmatch);

module.exports = router;