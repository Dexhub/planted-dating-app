/**
 * Values Assessment and Compatibility Routes
 * 
 * Handles all endpoints related to values profiling and compatibility analysis
 * for enhanced matching in the Planted dating app.
 */

const express = require('express');
const router = express.Router();
const {
  getValuesProfile,
  updateValuesSection,
  getValuesCompatibility,
  getAssessmentStatus,
  getValueBasedMatches,
  getValuesInsights,
  updateCompatibilityPreferences,
  getDetailedCompatibility
} = require('../controllers/valuesController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication and verification
router.use(protect);
router.use(verifiedOnly);

// Values Profile Management
router.get('/profile', getValuesProfile);
router.put('/profile/:section', updateValuesSection);
router.get('/assessment-status', getAssessmentStatus);
router.get('/insights', getValuesInsights);

// Compatibility Analysis
router.get('/compatibility/:userId', getValuesCompatibility);
router.get('/detailed-compatibility/:userId', getDetailedCompatibility);
router.get('/matches', getValueBasedMatches);

// Preferences Management
router.put('/compatibility-preferences', updateCompatibilityPreferences);

module.exports = router;