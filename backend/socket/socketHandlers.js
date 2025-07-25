const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id firstName lastName');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.firstName} connected`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Update user's online status
    User.findByIdAndUpdate(socket.userId, {
      lastActive: Date.now()
    }).exec();

    // Handle joining match rooms
    socket.on('join_match', async (matchId) => {
      // Verify user has access to this match
      const Match = require('../models/Match');
      const match = await Match.findOne({
        _id: matchId,
        users: socket.userId
      });

      if (match) {
        socket.join(`match:${matchId}`);
        socket.emit('joined_match', { matchId });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ matchId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('user_typing', {
        matchId,
        userId: socket.userId
      });
    });

    socket.on('typing_stop', ({ matchId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('user_stopped_typing', {
        matchId,
        userId: socket.userId
      });
    });

    // Handle real-time location sharing
    socket.on('share_location', ({ matchId, location }) => {
      socket.to(`match:${matchId}`).emit('location_shared', {
        userId: socket.userId,
        location
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} disconnected`);
      
      // Update last active
      User.findByIdAndUpdate(socket.userId, {
        lastActive: Date.now()
      }).exec();

      // Notify matches that user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });
  });
};