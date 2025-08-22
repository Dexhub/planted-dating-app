import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Messages.css';

const Messages = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinMatch, sendTypingStatus } = useSocket();
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const selectedMatch = matches.find(m => m.id === matchId);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (matchId) {
      fetchMessages();
      joinMatch(matchId);
    }
  }, [matchId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('messages_read');
    };
  }, [socket, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/matches');
      setMatches(response.data.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/messages/${matchId}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleNewMessage = (data) => {
    if (data.message.match === matchId) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleUserTyping = (data) => {
    if (data.matchId === matchId) {
      setOtherUserTyping(true);
    }
  };

  const handleUserStoppedTyping = (data) => {
    if (data.matchId === matchId) {
      setOtherUserTyping(false);
    }
  };

  const handleMessagesRead = (data) => {
    if (data.matchId === matchId) {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
      ));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post('/messages', {
        matchId,
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typing && selectedMatch) {
      setTyping(true);
      sendTypingStatus(matchId, selectedMatch.user._id, true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (typing && selectedMatch) {
        setTyping(false);
        sendTypingStatus(matchId, selectedMatch.user._id, false);
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const startVideoCall = () => {
    if (!selectedMatch) return;
    
    // Generate a unique room ID for the video call
    const roomId = `${matchId}-${Date.now()}`;
    
    // Notify the other user about the call
    socket.emit('video:invite', {
      matchId,
      receiverId: selectedMatch.user._id,
      roomId
    });
    
    // Navigate to video chat
    navigate(`/video/${roomId}`);
  };

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="messages">
      <div className="messages-container">
        <div className="conversations-sidebar">
          <h2>Conversations</h2>
          <div className="conversations-list">
            {matches.length === 0 ? (
              <div className="no-conversations">
                <p>No conversations yet</p>
                <Link to="/browse" className="link-green">
                  Start matching
                </Link>
              </div>
            ) : (
              matches.map(match => (
                <Link
                  key={match.id}
                  to={`/messages/${match.id}`}
                  className={`conversation-item ${match.id === matchId ? 'active' : ''}`}
                >
                  <div className="conversation-photo">
                    {match.user.photos && match.user.photos.length > 0 ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${match.user.photos[0].url}`}
                        alt={match.user.firstName}
                      />
                    ) : (
                      <div className="no-photo">🌱</div>
                    )}
                  </div>
                  <div className="conversation-info">
                    <h4>{match.user.firstName}</h4>
                    <p>{match.user.dietaryPreference}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="chat-area">
          {!matchId ? (
            <div className="no-chat-selected">
              <h2>Select a conversation</h2>
              <p>Choose someone to start chatting</p>
            </div>
          ) : selectedMatch ? (
            <>
              <div className="chat-header">
                <Link to={`/profile/${selectedMatch.user._id}`} className="chat-user-info">
                  <div className="chat-user-photo">
                    {selectedMatch.user.photos && selectedMatch.user.photos.length > 0 ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedMatch.user.photos[0].url}`}
                        alt={selectedMatch.user.firstName}
                      />
                    ) : (
                      <div className="no-photo">🌱</div>
                    )}
                  </div>
                  <div className="chat-user-details">
                    <h3>{selectedMatch.user.firstName}</h3>
                    <p>{selectedMatch.user.dietaryPreference}</p>
                  </div>
                </Link>
                <button 
                  className="video-call-btn"
                  onClick={startVideoCall}
                  title="Start video call"
                >
                  📹
                </button>
              </div>

              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet</p>
                    <p>Say hello to {selectedMatch.user.firstName}!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const showDate = index === 0 || 
                        formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                      const isOwn = message.sender._id === user.id;

                      return (
                        <div key={message._id}>
                          {showDate && (
                            <div className="date-divider">
                              <span>{formatDate(message.createdAt)}</span>
                            </div>
                          )}
                          <div className={`message ${isOwn ? 'own' : 'other'}`}>
                            <div className="message-content">
                              <p>{message.content}</p>
                              <div className="message-info">
                                <span className="message-time">
                                  {formatTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <span className="message-status">
                                    {message.isRead ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {otherUserTyping && (
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form onSubmit={sendMessage} className="message-input-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  <span>{sending ? '...' : '→'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="loading"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;