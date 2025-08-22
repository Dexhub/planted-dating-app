import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import './VideoCallNotification.css';

const VideoCallNotification = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringtone] = useState(new Audio('/ringtone.mp3'));

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      ringtone.loop = true;
      ringtone.play().catch(e => console.log('Audio play failed:', e));
    };

    socket.on('video:incoming-call', handleIncomingCall);

    return () => {
      socket.off('video:incoming-call', handleIncomingCall);
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [socket, ringtone]);

  const acceptCall = () => {
    ringtone.pause();
    ringtone.currentTime = 0;
    navigate(`/video/${incomingCall.roomId}`);
    setIncomingCall(null);
  };

  const declineCall = () => {
    ringtone.pause();
    ringtone.currentTime = 0;
    
    // Notify caller that call was declined
    socket.emit('video:call-declined', {
      callerId: incomingCall.callerId,
      matchId: incomingCall.matchId
    });
    
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          className="video-call-notification"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="call-content">
            <div className="call-icon">📹</div>
            <div className="call-info">
              <h3>Incoming Video Call</h3>
              <p>{incomingCall.callerName} is calling you</p>
            </div>
            <div className="call-actions">
              <button 
                className="decline-btn"
                onClick={declineCall}
                title="Decline"
              >
                ❌
              </button>
              <button 
                className="accept-btn"
                onClick={acceptCall}
                title="Accept"
              >
                ✅
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoCallNotification;