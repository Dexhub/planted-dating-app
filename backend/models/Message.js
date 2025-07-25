const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message cannot be empty'],
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'voice'],
    default: 'text'
  },
  mediaUrl: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedFor: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Mark message as read
messageSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  await this.save();
};

// Mark message as delivered
messageSchema.methods.markAsDelivered = async function() {
  this.isDelivered = true;
  this.deliveredAt = Date.now();
  await this.save();
};

// Soft delete for a user
messageSchema.methods.deleteForUser = async function(userId) {
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
    await this.save();
  }
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(matchId, limit = 50, before = null) {
  const query = {
    match: matchId,
    isDeleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return await this.find(query)
    .populate('sender', 'firstName lastName photos')
    .populate('receiver', 'firstName lastName photos')
    .sort('-createdAt')
    .limit(limit);
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false
  });
};

module.exports = mongoose.model('Message', messageSchema);