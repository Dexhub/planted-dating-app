import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './CompatibilityInsights.css';

const CompatibilityInsights = ({ user1, user2, score }) => {
  const [insights, setInsights] = useState([]);
  const [expandedInsight, setExpandedInsight] = useState(null);

  useEffect(() => {
    generateInsights();
  }, [user1, user2]);

  const generateInsights = () => {
    const newInsights = [];

    // Dietary Compatibility
    if (user1.dietaryPreference === user2.dietaryPreference) {
      newInsights.push({
        id: 'diet',
        type: 'perfect',
        title: 'Perfect Dietary Match',
        description: `You're both ${user1.dietaryPreference}! No awkward "where should we eat?" conversations.`,
        icon: '🌱',
        tips: [
          'Try cooking a new recipe together',
          'Explore local vegan/vegetarian restaurants',
          'Share your favorite plant-based dishes'
        ]
      });
    } else {
      newInsights.push({
        id: 'diet',
        type: 'good',
        title: 'Compatible Diets',
        description: 'One vegan, one vegetarian - you both understand the plant-based lifestyle!',
        icon: '🥗',
        tips: [
          'Respect each other\'s dietary choices',
          'Find restaurants with options for both',
          'Learn about each other\'s journey'
        ]
      });
    }

    // Years Plant-Based
    const yearsDiff = Math.abs(user1.yearsBased - user2.yearsBased);
    if (yearsDiff <= 2) {
      newInsights.push({
        id: 'experience',
        type: 'good',
        title: 'Similar Journey Timeline',
        description: 'You both started your plant-based journey around the same time!',
        icon: '📅',
        tips: [
          'Share your transition stories',
          'Discuss challenges you\'ve overcome',
          'Celebrate milestones together'
        ]
      });
    }

    // Cooking Compatibility
    const cookingLevels = ['beginner', 'intermediate', 'advanced', 'chef-level'];
    const skill1 = cookingLevels.indexOf(user1.cookingSkill);
    const skill2 = cookingLevels.indexOf(user2.cookingSkill);
    
    if (Math.abs(skill1 - skill2) <= 1) {
      newInsights.push({
        id: 'cooking',
        type: 'perfect',
        title: 'Kitchen Chemistry',
        description: 'Your cooking skills are well-matched for culinary adventures!',
        icon: '👨‍🍳',
        tips: [
          'Plan weekly cooking dates',
          'Take a plant-based cooking class together',
          'Create a shared recipe collection'
        ]
      });
    } else if (skill1 > skill2 + 1 || skill2 > skill1 + 1) {
      newInsights.push({
        id: 'cooking',
        type: 'opportunity',
        title: 'Teaching Opportunity',
        description: 'One of you can mentor the other in the kitchen!',
        icon: '📚',
        tips: [
          'Be patient and encouraging',
          'Start with simple recipes together',
          'Celebrate small cooking victories'
        ]
      });
    }

    // Shared Interests
    const sharedInterests = user1.interests.filter(i => user2.interests.includes(i));
    if (sharedInterests.length >= 3) {
      newInsights.push({
        id: 'interests',
        type: 'perfect',
        title: 'Lots in Common',
        description: `You share ${sharedInterests.length} interests! Plenty to talk about and do together.`,
        icon: '🎯',
        tips: sharedInterests.slice(0, 3).map(interest => 
          `Plan a ${interest}-themed date`
        )
      });
    }

    // Location
    if (user1.location.city === user2.location.city) {
      newInsights.push({
        id: 'location',
        type: 'perfect',
        title: 'Same City Convenience',
        description: 'Living in the same city makes spontaneous dates easy!',
        icon: '📍',
        tips: [
          'Discover new neighborhoods together',
          'Find your favorite local spots',
          'Meet up for lunch breaks'
        ]
      });
    }

    setInsights(newInsights);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00D27A';
    if (score >= 60) return '#FFD700';
    return '#FF6B6B';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Exceptional Match!';
    if (score >= 80) return 'Great Match!';
    if (score >= 70) return 'Good Match!';
    if (score >= 60) return 'Promising Match!';
    return 'Worth Exploring!';
  };

  return (
    <div className="compatibility-insights">
      <div className="compatibility-header">
        <h2>Compatibility Insights</h2>
        <div className="compatibility-score" style={{ borderColor: getScoreColor(score) }}>
          <div className="score-number" style={{ color: getScoreColor(score) }}>
            {score}%
          </div>
          <div className="score-message">{getScoreMessage(score)}</div>
        </div>
      </div>

      <div className="insights-grid">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            className={`insight-card ${insight.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setExpandedInsight(
              expandedInsight === insight.id ? null : insight.id
            )}
          >
            <div className="insight-header">
              <span className="insight-icon">{insight.icon}</span>
              <h3>{insight.title}</h3>
            </div>
            
            <p className="insight-description">{insight.description}</p>
            
            {expandedInsight === insight.id && (
              <motion.div 
                className="insight-tips"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <h4>Tips for Success:</h4>
                <ul>
                  {insight.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            <div className="expand-indicator">
              {expandedInsight === insight.id ? '−' : '+'}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="ai-note">
        <p>
          <strong>AI-Powered Analysis:</strong> These insights are generated based on 
          compatibility patterns from successful plant-based couples. Remember, every 
          relationship is unique!
        </p>
      </div>
    </div>
  );
};

export default CompatibilityInsights;