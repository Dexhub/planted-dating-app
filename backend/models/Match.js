const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected', 'unmatched'],
    default: 'pending'
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    },
    superLike: {
      type: Boolean,
      default: false
    }
  }],
  matchedAt: Date,
  unmatchedAt: Date,
  unmatchedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  sharedInterests: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
matchSchema.index({ users: 1, status: 1 });
matchSchema.index({ 'likes.user': 1 });
matchSchema.index({ matchedAt: -1 });

// Method to check if users are matched
matchSchema.methods.isMatched = function() {
  return this.status === 'matched';
};

// Method to check if a specific user has liked
matchSchema.methods.hasUserLiked = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Static method to find match between two users
matchSchema.statics.findMatchBetweenUsers = async function(userId1, userId2) {
  return await this.findOne({
    users: { $all: [userId1, userId2] }
  });
};

// Static method to get all matches for a user
matchSchema.statics.getUserMatches = async function(userId, status = 'matched') {
  return await this.find({
    users: userId,
    status: status
  })
  .populate('users', 'firstName lastName photos bio dietaryPreference')
  .sort('-matchedAt');
};

module.exports = mongoose.model('Match', matchSchema);