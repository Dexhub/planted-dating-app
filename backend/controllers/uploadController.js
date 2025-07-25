const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Upload profile photo
// @route   POST /api/upload/photo
// @access  Private
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const user = await User.findById(req.user.id);

    // Check if user already has 6 photos
    if (user.photos.length >= 6) {
      // Delete the uploaded file
      await fs.unlink(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 photos allowed'
      });
    }

    // Add photo to user's photos array
    const isFirstPhoto = user.photos.length === 0;
    user.photos.push({
      url: photoUrl,
      isMain: isFirstPhoto
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        url: photoUrl,
        isMain: isFirstPhoto
      }
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading photo',
      error: err.message
    });
  }
};

// @desc    Delete profile photo
// @route   DELETE /api/upload/photo/:photoId
// @access  Private
exports.deletePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const photoIndex = user.photos.findIndex(
      photo => photo._id.toString() === req.params.photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    const photo = user.photos[photoIndex];
    const wasMain = photo.isMain;

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', photo.url);
    await fs.unlink(filePath).catch(err => {
      console.error('Error deleting file:', err);
    });

    // Remove from user's photos array
    user.photos.splice(photoIndex, 1);

    // If deleted photo was main, set another as main
    if (wasMain && user.photos.length > 0) {
      user.photos[0].isMain = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting photo',
      error: err.message
    });
  }
};

// @desc    Set main photo
// @route   PUT /api/upload/photo/:photoId/main
// @access  Private
exports.setMainPhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const photoIndex = user.photos.findIndex(
      photo => photo._id.toString() === req.params.photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Set all photos as not main
    user.photos.forEach(photo => {
      photo.isMain = false;
    });

    // Set selected photo as main
    user.photos[photoIndex].isMain = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Main photo updated'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating main photo',
      error: err.message
    });
  }
};