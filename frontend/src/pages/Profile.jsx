import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    whyPlantBased: '',
    interests: [],
    favoriteRestaurants: [],
    cookingSkill: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(currentUser);
      setFormData({
        bio: currentUser.bio || '',
        whyPlantBased: currentUser.whyPlantBased || '',
        interests: currentUser.interests || [],
        favoriteRestaurants: currentUser.favoriteRestaurants || [],
        cookingSkill: currentUser.cookingSkill || ''
      });
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser, isOwnProfile]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.data);
    } catch (error) {
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Photo uploaded successfully');
      // Update local profile
      setProfile(prev => ({
        ...prev,
        photos: [...(prev.photos || []), response.data.data]
      }));
    } catch (error) {
      toast.error('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;

    try {
      await api.delete(`/upload/photo/${photoId}`);
      toast.success('Photo deleted');
      setProfile(prev => ({
        ...prev,
        photos: prev.photos.filter(p => p._id !== photoId)
      }));
    } catch (error) {
      toast.error('Error deleting photo');
    }
  };

  const handleSetMainPhoto = async (photoId) => {
    try {
      await api.put(`/upload/photo/${photoId}/main`);
      toast.success('Main photo updated');
      setProfile(prev => ({
        ...prev,
        photos: prev.photos.map(p => ({
          ...p,
          isMain: p._id === photoId
        }))
      }));
    } catch (error) {
      toast.error('Error updating main photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await updateProfile(formData);
    if (result.success) {
      setEditing(false);
      setProfile(currentUser);
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>Profile not found</h2>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="container">
        <motion.div 
          className="profile-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="profile-header">
            <h1>{profile.firstName} {profile.lastName}</h1>
            {profile.isFoundingMember && (
              <span className="founding-badge">
                🌟 Founding Member #{profile.memberNumber}
              </span>
            )}
          </div>

          <div className="profile-photos">
            <h2>Photos</h2>
            <div className="photos-grid">
              {profile.photos?.map(photo => (
                <div key={photo._id} className="photo-item">
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photo.url}`}
                    alt="Profile"
                  />
                  {isOwnProfile && (
                    <div className="photo-actions">
                      {!photo.isMain && (
                        <button onClick={() => handleSetMainPhoto(photo._id)}>
                          Set as Main
                        </button>
                      )}
                      <button onClick={() => handleDeletePhoto(photo._id)}>
                        Delete
                      </button>
                    </div>
                  )}
                  {photo.isMain && (
                    <div className="main-badge">Main</div>
                  )}
                </div>
              ))}
              
              {isOwnProfile && profile.photos?.length < 6 && (
                <label className="photo-upload">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                  <div className="upload-content">
                    {uploading ? (
                      <div className="loading"></div>
                    ) : (
                      <>
                        <span>+</span>
                        <p>Add Photo</p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="profile-details">
            {!editing ? (
              <>
                <div className="detail-section">
                  <h3>About Me</h3>
                  <p>{profile.bio}</p>
                </div>

                <div className="detail-section">
                  <h3>Why I'm Plant-Based</h3>
                  <p>{profile.whyPlantBased}</p>
                </div>

                <div className="detail-section">
                  <h3>Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Age:</strong> {profile.age}
                    </div>
                    <div className="detail-item">
                      <strong>Location:</strong> {profile.location.city}
                    </div>
                    <div className="detail-item">
                      <strong>Diet:</strong> {profile.dietaryPreference}
                    </div>
                    <div className="detail-item">
                      <strong>Years Plant-Based:</strong> {profile.yearsBased}
                    </div>
                    <div className="detail-item">
                      <strong>Cooking:</strong> {profile.cookingSkill.replace('-', ' ')}
                    </div>
                  </div>
                </div>

                {profile.interests?.length > 0 && (
                  <div className="detail-section">
                    <h3>Interests</h3>
                    <div className="interests-list">
                      {profile.interests.map(interest => (
                        <span key={interest} className="interest-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <button 
                    className="btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="bio">About Me</label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="whyPlantBased">Why I'm Plant-Based</label>
                  <textarea
                    id="whyPlantBased"
                    value={formData.whyPlantBased}
                    onChange={e => setFormData({...formData, whyPlantBased: e.target.value})}
                    rows={3}
                    maxLength={300}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cookingSkill">Cooking Skill</label>
                  <select
                    id="cookingSkill"
                    value={formData.cookingSkill}
                    onChange={e => setFormData({...formData, cookingSkill: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="chef-level">Chef Level</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Interests</label>
                  <div className="interests-select">
                    {['cooking', 'fitness', 'yoga', 'meditation', 'hiking', 'travel', 'music', 'art', 'reading', 'gardening', 'activism', 'sustainability'].map(interest => (
                      <label key={interest} className="interest-option">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;