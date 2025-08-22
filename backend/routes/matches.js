const express = require('express');
const router = express.Router();
const {
  swipeUser,
  getMatches,
  getLikes,
  unmatch,
  getPotentialMatches,
  getMatchingMetrics
} = require('../controllers/matchController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication and verification
router.use(protect);
router.use(verifiedOnly);

router.post('/swipe', swipeUser);
router.get('/', getMatches);
router.get('/likes', getLikes);
router.get('/potential', getPotentialMatches);
router.get('/metrics', getMatchingMetrics);
router.delete('/:matchId', unmatch);

module.exports = router;