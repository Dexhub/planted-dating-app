import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  const joinMatch = (matchId) => {
    if (socket && connected) {
      socket.emit('join_match', matchId);
    }
  };

  const sendTypingStatus = (matchId, receiverId, isTyping) => {
    if (socket && connected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
        matchId,
        receiverId
      });
    }
  };

  const shareLocation = (matchId, location) => {
    if (socket && connected) {
      socket.emit('share_location', {
        matchId,
        location
      });
    }
  };

  const value = {
    socket,
    connected,
    joinMatch,
    sendTypingStatus,
    shareLocation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};