import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, likesRes] = await Promise.all([
        api.get('/matches'),
        api.get('/matches/likes')
      ]);
      
      setMatches(matchesRes.data.data);
      setLikes(likesRes.data.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to unmatch?')) return;

    try {
      await api.delete(`/matches/${matchId}`);
      setMatches(matches.filter(m => m.id !== matchId));
    } catch (error) {
      console.error('Error unmatching:', error);
    }
  };

  const formatDate = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="matches-loading">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="matches">
      <div className="container">
        <h1>Your Connections</h1>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches ({matches.length})
          </button>
          <button 
            className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            Likes You ({likes.length})
          </button>
        </div>

        {activeTab === 'matches' && (
          <motion.div 
            className="matches-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {matches.length === 0 ? (
              <div className="empty-state">
                <h2>No matches yet</h2>
                <p>Keep swiping to find your perfect plant-based partner!</p>
                <Link to="/browse" className="btn-primary">
                  Start Browsing
                </Link>
              </div>
            ) : (
              matches.map(match => (
                <div key={match.id} className="match-card">
                  <Link to={`/messages/${match.id}`} className="match-photo">
                    {match.user.photos && match.user.photos.length > 0 ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${match.user.photos[0].url}`}
                        alt={match.user.firstName}
                      />
                    ) : (
                      <div className="no-photo">
                        <span>🌱</span>
                      </div>
                    )}
                    {match.compatibilityScore && (
                      <div className="compatibility-badge">
                        {match.compatibilityScore}% match
                      </div>
                    )}
                  </Link>
                  
                  <div className="match-info">
                    <h3>{match.user.firstName}</h3>
                    <p className="dietary">{match.user.dietaryPreference}</p>
                    <p className="bio">{match.user.bio}</p>
                    
                    {match.sharedInterests && match.sharedInterests.length > 0 && (
                      <div className="shared-interests">
                        <span className="label">Shared:</span>
                        {match.sharedInterests.slice(0, 3).map(interest => (
                          <span key={interest} className="interest">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="match-actions">
                      <Link to={`/messages/${match.id}`} className="btn-primary small">
                        Message
                      </Link>
                      <button 
                        onClick={() => handleUnmatch(match.id)}
                        className="btn-secondary small"
                      >
                        Unmatch
                      </button>
                    </div>
                    
                    <p className="match-date">
                      Matched {formatDate(match.matchedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'likes' && (
          <motion.div 
            className="likes-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {likes.length === 0 ? (
              <div className="empty-state">
                <h2>No likes yet</h2>
                <p>Your admirers will appear here!</p>
              </div>
            ) : (
              likes.map(like => (
                <div key={like.matchId} className="like-card">
                  <div className="like-photo">
                    {like.user.photos && like.user.photos.length > 0 ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${like.user.photos[0].url}`}
                        alt={like.user.firstName}
                      />
                    ) : (
                      <div className="no-photo">
                        <span>🌱</span>
                      </div>
                    )}
                    {like.superLike && (
                      <div className="super-like-badge">
                        ⭐ Super Like!
                      </div>
                    )}
                  </div>
                  
                  <div className="like-info">
                    <h3>{like.user.firstName}</h3>
                    <p className="dietary">{like.user.dietaryPreference}</p>
                    <p className="bio">{like.user.bio}</p>
                    <p className="like-date">
                      Liked you {formatDate(like.likedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Matches;