import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './CompatibilityInsights.css';

const CompatibilityInsights = ({ userId, onClose }) => {
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      fetchCompatibility();
    }
  }, [userId]);

  const fetchCompatibility = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/values/detailed-compatibility/${userId}`);
      setCompatibility(response.data.data);
    } catch (error) {
      console.error('Error fetching compatibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="compatibility-insights">
        <div className="loading-state">
          <div className="loading"></div>
          <p>Analyzing compatibility...</p>
        </div>
      </div>
    );
  }

  if (!compatibility) {
    return (
      <div className="compatibility-insights">
        <div className="error-state">
          <p>Unable to load compatibility analysis</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const { compatibility: analysis, userContext, recommendations } = compatibility;

  return (
    <motion.div 
      className="compatibility-insights"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="insights-header">
        <div className="header-content">
          <h2>Compatibility with {userContext.target.firstName}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="compatibility-score">
          <div className="score-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--background-secondary)"
                strokeWidth="8"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--primary-green)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - analysis.overallScore / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.overallScore / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="score-text">
              <span className="score-number">{analysis.overallScore}</span>
              <span className="score-label">Match</span>
            </div>
          </div>
          
          <div className="score-description">
            <p className="compatibility-level">
              {analysis.overallScore >= 85 ? '🎉 Exceptional Match' :
               analysis.overallScore >= 70 ? '💚 Great Compatibility' :
               analysis.overallScore >= 55 ? '🤝 Good Potential' : '🤔 Some Challenges'}
            </p>
          </div>
        </div>
      </div>

      <div className="insights-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          Detailed Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      <div className="insights-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            analysis={analysis} 
            userContext={userContext}
          />
        )}
        
        {activeTab === 'breakdown' && (
          <BreakdownTab 
            breakdown={analysis.breakdown}
          />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab 
            recommendations={recommendations}
            analysis={analysis}
          />
        )}
      </div>
    </motion.div>
  );
};

const OverviewTab = ({ analysis, userContext }) => (
  <div className="overview-tab">
    <div className="insights-grid">
      {analysis.insights.map((insight, index) => (
        <motion.div 
          key={index}
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <p>{insight}</p>
        </motion.div>
      ))}
    </div>

    <div className="user-context">
      <h3>Profile Comparison</h3>
      <div className="context-grid">
        <div className="context-item">
          <strong>Dietary Preference:</strong>
          <div className="comparison">
            <span>{userContext.current.dietaryPreference}</span>
            <span className="vs">vs</span>
            <span>{userContext.target.dietaryPreference}</span>
          </div>
        </div>
        
        <div className="context-item">
          <strong>Plant-based Experience:</strong>
          <div className="comparison">
            <span>{userContext.current.yearsBased} years</span>
            <span className="vs">vs</span>
            <span>{userContext.target.yearsBased} years</span>
          </div>
        </div>

        <div className="context-item">
          <strong>Shared Interests:</strong>
          <div className="shared-interests">
            {userContext.current.interests?.filter(interest => 
              userContext.target.interests?.includes(interest)
            ).map(interest => (
              <span key={interest} className="interest-tag">{interest}</span>
            )) || <span className="no-shared">No shared interests found</span>}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BreakdownTab = ({ breakdown }) => (
  <div className="breakdown-tab">
    <div className="breakdown-categories">
      {Object.entries(breakdown).map(([category, data]) => (
        <motion.div 
          key={category}
          className="breakdown-category"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="category-header">
            <h4>{formatCategoryName(category)}</h4>
            <div className="category-score">
              <span className="score">{typeof data === 'object' ? data.composite || data.score : data}</span>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ width: `${(typeof data === 'object' ? data.composite || data.score : data)}%` }}
                />
              </div>
            </div>
          </div>
          
          {typeof data === 'object' && data.details && (
            <div className="category-details">
              {Object.entries(data.details).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="detail-label">{formatDetailName(key)}:</span>
                  <span className="detail-value">{formatDetailValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

const RecommendationsTab = ({ recommendations, analysis }) => (
  <div className="recommendations-tab">
    <div className="recommendations-section">
      <h3>💬 Conversation Starters</h3>
      <div className="recommendations-list">
        {recommendations.conversationStarters?.map((starter, index) => (
          <motion.div 
            key={index}
            className="recommendation-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="recommendation-icon">💭</span>
            <p>"{starter}"</p>
          </motion.div>
        ))}
      </div>
    </div>

    <div className="recommendations-section">
      <h3>💡 Relationship Tips</h3>
      <div className="recommendations-list">
        {recommendations.relationshipTips?.map((tip, index) => (
          <motion.div 
            key={index}
            className="recommendation-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="recommendation-icon">💡</span>
            <p>{tip}</p>
          </motion.div>
        ))}
      </div>
    </div>

    {recommendations.potentialChallenges?.length > 0 && (
      <div className="recommendations-section">
        <h3>⚠️ Potential Challenges</h3>
        <div className="recommendations-list">
          {recommendations.potentialChallenges.map((challenge, index) => (
            <motion.div 
              key={index}
              className="recommendation-item warning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="recommendation-icon">⚠️</span>
              <p>{challenge}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )}

    <div className="recommendations-section">
      <h3>🌱 Growth Opportunities</h3>
      <div className="recommendations-list">
        {analysis.recommendations?.map((rec, index) => (
          <motion.div 
            key={index}
            className="recommendation-item growth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="recommendation-icon">🌱</span>
            <p>{rec}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

// Helper functions
const formatCategoryName = (category) => {
  const names = {
    ethicalMotivation: 'Ethical Values',
    lifestyle: 'Lifestyle Compatibility',
    journeyStage: 'Journey Stage',
    valuesAlignment: 'Values Alignment',
    cultural: 'Cultural Compatibility'
  };
  return names[category] || category;
};

const formatDetailName = (detail) => {
  return detail.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
};

const formatDetailValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? '✅ Yes' : '❌ No';
  }
  if (typeof value === 'string') {
    return value.replace(/-/g, ' ').replace(/^./, str => str.toUpperCase());
  }
  return value;
};

export default CompatibilityInsights;