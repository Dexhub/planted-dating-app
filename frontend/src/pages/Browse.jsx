import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import FilterModal from '../components/FilterModal';
import { ProfileCardSkeleton } from '../components/Skeleton';
import ProgressiveImage from '../components/ProgressiveImage';
import './Browse.css';

const Browse = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: { min: 18, max: 99 },
    distance: 50,
    dietaryPreference: 'all',
    cookingSkill: 'all',
    interests: [],
    yearsBased: { min: 0, max: 50 },
    lastActive: 'all'
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/users');
      setProfiles(response.data.data);
    } catch (error) {
      toast.error('Error loading profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (userId, action, superLike = false) => {
    if (swiping) return;
    setSwiping(true);

    try {
      const response = await api.post('/matches/swipe', {
        userId,
        action,
        superLike
      });

      if (response.data.matched) {
        toast.success(`It's a match with ${response.data.matchedUser.firstName}! 🎉`, {
          duration: 5000
        });
      }

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwiping(false);
      }, 300);

    } catch (error) {
      toast.error('Error processing swipe');
      setSwiping(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading"></div>
        <p>Finding your perfect match...</p>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="browse-empty">
        <h2>No more profiles</h2>
        <p>Check back later for new members!</p>
      </div>
    );
  }

  return (
    <div className="browse">
      <div className="browse-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProfile._id}
            className="profile-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              x: swiping === 'left' ? -300 : swiping === 'right' ? 300 : 0,
              opacity: 0,
              scale: 0.8,
              rotate: swiping === 'left' ? -20 : swiping === 'right' ? 20 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="profile-images">
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${currentProfile.photos[0].url}`}
                  alt={currentProfile.firstName}
                />
              ) : (
                <div className="no-photo">
                  <span>🌱</span>
                  <p>No photo yet</p>
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-header">
                <h2>{currentProfile.firstName}, {currentProfile.age}</h2>
                <span className="dietary-badge">
                  {currentProfile.dietaryPreference === 'vegan' ? '🌱 Vegan' : '🥗 Vegetarian'}
                </span>
              </div>

              <div className="profile-location">
                📍 {currentProfile.location.city}
              </div>

              <div className="profile-bio">
                <p>{currentProfile.bio}</p>
              </div>

              <div className="profile-details">
                <div className="detail-item">
                  <strong>Plant-based for:</strong> {currentProfile.yearsBased} years
                </div>
                <div className="detail-item">
                  <strong>Why plant-based:</strong> {currentProfile.whyPlantBased}
                </div>
                <div className="detail-item">
                  <strong>Cooking:</strong> {currentProfile.cookingSkill.replace('-', ' ')}
                </div>
              </div>

              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div className="profile-interests">
                  {currentProfile.interests.map(interest => (
                    <span key={interest} className="interest-tag">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="swipe-actions">
              <button 
                className="action-btn pass"
                onClick={() => {
                  setSwiping('left');
                  handleSwipe(currentProfile._id, 'pass');
                }}
                disabled={swiping}
              >
                <span>❌</span>
              </button>
              
              <button 
                className="action-btn super-like"
                onClick={() => {
                  setSwiping('up');
                  handleSwipe(currentProfile._id, 'like', true);
                }}
                disabled={swiping}
              >
                <span>⭐</span>
              </button>

              <button 
                className="action-btn like"
                onClick={() => {
                  setSwiping('right');
                  handleSwipe(currentProfile._id, 'like');
                }}
                disabled={swiping}
              >
                <span>💚</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="browse-info">
          <p>{profiles.length - currentIndex - 1} more profiles to see</p>
        </div>
      </div>
    </div>
  );
};

export default Browse;