import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './VideoChat.css';

const VideoChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, calling, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [matchInfo, setMatchInfo] = useState(null);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const callTimerRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!roomId) {
      navigate('/matches');
      return;
    }

    initializeCall();
    
    return () => {
      endCall();
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);
    socket.on('video:end-call', handleRemoteEndCall);
    socket.on('video:user-joined', handleUserJoined);

    return () => {
      socket.off('video:offer');
      socket.off('video:answer');
      socket.off('video:ice-candidate');
      socket.off('video:end-call');
      socket.off('video:user-joined');
    };
  }, [socket]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join video room
      socket.emit('video:join-room', { roomId });
      
      // Fetch match info
      const matchId = roomId.split('-')[0]; // Assuming roomId format: matchId-timestamp
      const response = await api.get(`/matches/${matchId}`);
      setMatchInfo(response.data.data);
      
      setCallStatus('calling');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Unable to access camera/microphone');
      navigate('/matches');
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };
    
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setCallStatus('connected');
      startCallTimer();
    };
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    peerConnectionRef.current = pc;
    return pc;
  };

  const handleUserJoined = async () => {
    // Create offer when another user joins
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('video:offer', {
      roomId,
      offer
    });
  };

  const handleOffer = async ({ offer }) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('video:answer', {
      roomId,
      answer
    });
  };

  const handleAnswer = async ({ answer }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  };

  const handleRemoteEndCall = () => {
    toast.info('Call ended by other user');
    endCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Notify other user
    if (socket && callStatus !== 'ended') {
      socket.emit('video:end-call', { roomId });
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    setCallStatus('ended');
    
    // Navigate back after a delay
    setTimeout(() => {
      navigate('/matches');
    }, 2000);
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-chat">
      <div className="video-container">
        <motion.div 
          className="remote-video"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className={callStatus !== 'connected' ? 'hidden' : ''}
          />
          {callStatus !== 'connected' && (
            <div className="call-status">
              <img 
                src={matchInfo?.photos?.[0]?.url || '/default-avatar.png'} 
                alt={matchInfo?.firstName}
                className="caller-avatar"
              />
              <h2>{matchInfo?.firstName || 'Connecting...'}</h2>
              <p>
                {callStatus === 'initializing' && 'Initializing call...'}
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'ended' && 'Call ended'}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div 
          className="local-video"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ scale: 0.9 }}
        >
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className={isVideoOff ? 'hidden' : ''}
          />
          {isVideoOff && (
            <div className="video-off-placeholder">
              <span>📹</span>
              <p>Camera off</p>
            </div>
          )}
        </motion.div>

        {callStatus === 'connected' && (
          <div className="call-duration">
            {formatDuration(callDuration)}
          </div>
        )}

        <div className="video-controls">
          <button 
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            disabled={callStatus !== 'connected'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <button 
            className="control-btn end-call"
            onClick={endCall}
          >
            📞
          </button>
          
          <button 
            className={`control-btn ${isVideoOff ? 'active' : ''}`}
            onClick={toggleVideo}
            disabled={callStatus !== 'connected'}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>
        </div>

        {/* Virtual date ideas */}
        {callStatus === 'connected' && (
          <motion.div 
            className="date-ideas"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <h3>Virtual Date Ideas</h3>
            <ul>
              <li>🍝 Cook the same recipe together</li>
              <li>🎬 Watch a documentary simultaneously</li>
              <li>🎮 Play an online game</li>
              <li>☕ Have a virtual coffee date</li>
              <li>🧘 Do yoga together</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VideoChat;