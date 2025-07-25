import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    ageRange: user?.preferences?.ageRange || { min: 18, max: 99 },
    distance: user?.preferences?.distance || 50,
    dietaryDealbreaker: user?.preferences?.dietaryDealbreaker ?? true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/users/profile', { preferences });
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Error updating preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/users/account');
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error('Error deleting account');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="settings-section">
            <h2>Account Information</h2>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              
              <div className="info-item">
                <label>Member Since</label>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="info-item">
                <label>Membership Status</label>
                <p className="status">{user.subscription.status}</p>
              </div>
              
              {user.isFoundingMember && (
                <div className="info-item">
                  <label>Founding Member</label>
                  <p className="founding">#{user.memberNumber} of 100</p>
                </div>
              )}
            </div>

            <div className="verification-status">
              <h3>Verification Status</h3>
              <div className="verification-items">
                <div className={`verification-item ${user.verification.email ? 'verified' : ''}`}>
                  <span className="icon">{user.verification.email ? '✓' : '○'}</span>
                  <span>Email Verified</span>
                </div>
                
                <div className={`verification-item ${user.verification.payment ? 'verified' : ''}`}>
                  <span className="icon">{user.verification.payment ? '✓' : '○'}</span>
                  <span>Payment Verified</span>
                </div>
                
                <div className={`verification-item ${user.verification.video ? 'verified' : ''}`}>
                  <span className="icon">{user.verification.video ? '✓' : '○'}</span>
                  <span>Video Verified</span>
                </div>
              </div>
            </div>

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p>Once you delete your account, there is no going back.</p>
              <button 
                className="btn-danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="settings-section">
            <h2>Match Preferences</h2>
            
            <form onSubmit={handlePreferencesUpdate}>
              <div className="form-group">
                <label>Age Range</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={preferences.ageRange.min}
                    onChange={e => setPreferences({
                      ...preferences,
                      ageRange: { ...preferences.ageRange, min: parseInt(e.target.value) }
                    })}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={preferences.ageRange.max}
                    onChange={e => setPreferences({
                      ...preferences,
                      ageRange: { ...preferences.ageRange, max: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="distance">Maximum Distance</label>
                <div className="distance-input">
                  <input
                    type="range"
                    id="distance"
                    min="10"
                    max="500"
                    step="10"
                    value={preferences.distance}
                    onChange={e => setPreferences({
                      ...preferences,
                      distance: parseInt(e.target.value)
                    })}
                  />
                  <span>{preferences.distance} miles</span>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.dietaryDealbreaker}
                    onChange={e => setPreferences({
                      ...preferences,
                      dietaryDealbreaker: e.target.checked
                    })}
                  />
                  <span>Only show strictly vegan/vegetarian matches</span>
                </label>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h2>Security Settings</h2>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value
                  })}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value
                  })}
                  minLength="6"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings">
      <div className="container">
        <motion.div 
          className="settings-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Settings</h1>
          
          <div className="settings-tabs">
            <button 
              className={`tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button 
              className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
            <button 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>

          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;