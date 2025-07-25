const Message = require('../models/Message');
const Match = require('../models/Match');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { matchId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    // Verify match exists and users are matched
    const match = await Match.findOne({
      _id: matchId,
      users: senderId,
      status: 'matched'
    }).populate('users', '_id');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found or not authorized'
      });
    }

    // Find receiver
    const receiverId = match.users.find(user => 
      user._id.toString() !== senderId
    )._id;

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      receiver: receiverId,
      content,
      type
    });

    // Update match last activity
    match.lastActivity = Date.now();
    await match.save();

    // Populate sender info for response
    await message.populate('sender', 'firstName lastName photos');

    // Emit socket event for real-time delivery
    if (req.io) {
      req.io.to(`user:${receiverId}`).emit('new_message', {
        message: message
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: err.message
    });
  }
};

// @desc    Get messages for a match
// @route   GET /api/messages/:matchId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { before, limit = 50 } = req.query;

    // Verify user has access to this match
    const match = await Match.findOne({
      _id: matchId,
      users: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found or not authorized'
      });
    }

    // Get messages
    const messages = await Message.getConversation(
      matchId, 
      parseInt(limit), 
      before
    );

    // Filter out messages deleted for this user
    const filteredMessages = messages.filter(msg => 
      !msg.deletedFor.includes(req.user.id)
    );

    // Mark messages as read
    const unreadMessages = filteredMessages.filter(msg => 
      msg.receiver.toString() === req.user.id && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map(m => m._id) },
          receiver: req.user.id
        },
        {
          isRead: true,
          readAt: Date.now()
        }
      );

      // Emit read receipts
      if (req.io) {
        const senderId = unreadMessages[0].sender._id;
        req.io.to(`user:${senderId}`).emit('messages_read', {
          matchId,
          messageIds: unreadMessages.map(m => m._id)
        });
      }
    }

    res.status(200).json({
      success: true,
      count: filteredMessages.length,
      data: filteredMessages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: err.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:matchId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const result = await Message.updateMany(
      {
        match: matchId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: err.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Soft delete for user
    await message.deleteForUser(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: err.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: err.message
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/react
// @access  Private
exports.addReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove existing reaction from user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user.id
    );

    // Add new reaction
    if (emoji) {
      message.reactions.push({
        user: req.user.id,
        emoji
      });
    }

    await message.save();

    // Emit socket event
    if (req.io) {
      const otherUserId = message.sender.toString() === req.user.id 
        ? message.receiver 
        : message.sender;
      
      req.io.to(`user:${otherUserId}`).emit('message_reaction', {
        messageId: message._id,
        emoji,
        userId: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: err.message
    });
  }
};