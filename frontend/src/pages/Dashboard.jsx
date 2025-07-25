import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import Onboarding from '../components/Onboarding';
import './Dashboard.css';

const Dashboard = () => {
  const { user, verifyEmail } = useAuth();
  const [stats, setStats] = useState({
    matches: 0,
    likes: 0,
    messages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [matchesRes, likesRes, messagesRes] = await Promise.all([
        api.get('/matches'),
        api.get('/matches/likes'),
        api.get('/messages/unread')
      ]);

      setStats({
        matches: matchesRes.data.count || 0,
        likes: likesRes.data.count || 0,
        messages: messagesRes.data.unreadCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationSteps = () => {
    const steps = [];
    if (!user.verification.email) {
      steps.push({ type: 'email', title: 'Verify Your Email', description: 'Confirm your email address to unlock features' });
    }
    if (!user.verification.payment) {
      steps.push({ type: 'payment', title: 'Complete Payment Verification', description: '$1 verification to ensure authentic members' });
    }
    if (!user.verification.video) {
      steps.push({ type: 'video', title: 'Video Verification', description: 'Quick selfie video to verify your identity' });
    }
    if (!user.photos || user.photos.length === 0) {
      steps.push({ type: 'photos', title: 'Add Profile Photos', description: 'Upload at least one photo to start matching' });
    }
    return steps;
  };

  const verificationSteps = getVerificationSteps();
  const isFullyVerified = verificationSteps.length === 0;

  return (
    <div className="dashboard">
      <Onboarding />
      <div className="container">
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Welcome back, {user.firstName}!</h1>
          {user.isFoundingMember && (
            <div className="founding-badge">
              🌟 Founding Member #{user.memberNumber}
            </div>
          )}
        </motion.div>

        {!isFullyVerified && (
          <motion.div 
            className="verification-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2>Complete Your Profile</h2>
            <p>Finish these steps to start matching with other members:</p>
            <div className="verification-steps">
              {verificationSteps.map((step, index) => (
                <div key={step.type} className="verification-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <Link 
                    to={step.type === 'photos' ? '/profile' : '/settings'} 
                    className="btn-primary small"
                  >
                    Complete
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div 
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/matches" className="stat-card">
            <div className="stat-number">{stats.matches}</div>
            <div className="stat-label">Matches</div>
            <div className="stat-icon">💚</div>
          </Link>

          <Link to="/browse" className="stat-card">
            <div className="stat-number">{stats.likes}</div>
            <div className="stat-label">People Like You</div>
            <div className="stat-icon">✨</div>
          </Link>

          <Link to="/messages" className="stat-card">
            <div className="stat-number">{stats.messages}</div>
            <div className="stat-label">Unread Messages</div>
            <div className="stat-icon">💬</div>
          </Link>
        </motion.div>

        {isFullyVerified && (
          <motion.div 
            className="quick-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2>Ready to connect?</h2>
            <div className="action-buttons">
              <Link to="/browse" className="btn-primary">
                Start Browsing
              </Link>
              <Link to="/profile" className="btn-secondary">
                Edit Profile
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div 
          className="community-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>Community Updates</h2>
          <div className="community-card">
            <h3>Welcome to Our Founding Community!</h3>
            <p>
              You're among the first {user.isFoundingMember ? '100' : 'members'} to join Planted. 
              This exclusive group is shaping the future of conscious dating.
            </p>
            <p className="community-stat">
              Current members: <strong>73</strong> amazing individuals
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;