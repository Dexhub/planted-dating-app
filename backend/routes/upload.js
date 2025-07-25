const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadPhoto,
  deletePhoto,
  setMainPhoto
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/photo', upload.single('photo'), uploadPhoto);
router.delete('/photo/:photoId', deletePhoto);
router.put('/photo/:photoId/main', setMainPhoto);

module.exports = router;