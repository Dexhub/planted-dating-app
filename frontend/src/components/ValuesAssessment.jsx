import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './ValuesAssessment.css';

const ValuesAssessment = ({ onComplete }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [assessmentData, setAssessmentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const sections = [
    { 
      key: 'ethicalMotivations', 
      title: 'Ethical Motivations',
      subtitle: 'Understanding your core values and motivations',
      icon: '🌱'
    },
    { 
      key: 'lifestyleFactors', 
      title: 'Lifestyle Compatibility',
      subtitle: 'How you live and share your plant-based lifestyle',
      icon: '🏠'
    },
    { 
      key: 'journeyStage', 
      title: 'Your Journey',
      subtitle: 'Where you are in your plant-based experience',
      icon: '🛤️'
    },
    { 
      key: 'valuesPreferences', 
      title: 'Relationship Values',
      subtitle: 'What matters most in a partnership',
      icon: '💚'
    },
    { 
      key: 'culturalContext', 
      title: 'Cultural Context',
      subtitle: 'Your background and community environment',
      icon: '🌍'
    }
  ];

  useEffect(() => {
    fetchAssessmentStatus();
  }, []);

  const fetchAssessmentStatus = async () => {
    try {
      const response = await api.get('/values/assessment-status');
      setProgress(response.data.data.completionPercentage);
      
      // If partially completed, load existing data
      if (response.data.data.completionPercentage > 0) {
        const profileResponse = await api.get('/values/profile');
        setAssessmentData(profileResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching assessment status:', error);
    }
  };

  const handleSectionComplete = async (sectionKey, data) => {
    setLoading(true);
    try {
      await api.put(`/values/profile/${sectionKey}`, data);
      
      setAssessmentData(prev => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], ...data }
      }));

      toast.success('Section completed!');
      
      if (currentSection < sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        // Assessment complete
        setProgress(100);
        toast.success('Values assessment complete! 🎉');
        onComplete && onComplete();
      }
    } catch (error) {
      toast.error('Error saving assessment');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    const section = sections[currentSection];
    
    switch (section.key) {
      case 'ethicalMotivations':
        return <EthicalMotivationsSection onComplete={handleSectionComplete} data={assessmentData.ethicalMotivations} />;
      case 'lifestyleFactors':
        return <LifestyleFactorsSection onComplete={handleSectionComplete} data={assessmentData.lifestyleFactors} />;
      case 'journeyStage':
        return <JourneyStageSection onComplete={handleSectionComplete} data={assessmentData.journeyStage} />;
      case 'valuesPreferences':
        return <ValuesPreferencesSection onComplete={handleSectionComplete} data={assessmentData.valuesPreferences} />;
      case 'culturalContext':
        return <CulturalContextSection onComplete={handleSectionComplete} data={assessmentData.culturalContext} />;
      default:
        return null;
    }
  };

  return (
    <div className="values-assessment">
      <div className="assessment-header">
        <h1>Values Assessment</h1>
        <p>Help us understand your values for better matches</p>
        
        <div className="progress-bar">
          <div className="progress-track">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(currentSection / sections.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="progress-text">{currentSection + 1} of {sections.length}</span>
        </div>
      </div>

      <div className="section-navigation">
        {sections.map((section, index) => (
          <div 
            key={section.key}
            className={`nav-item ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-title">{section.title}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          className="section-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="section-header">
            <h2>{sections[currentSection].icon} {sections[currentSection].title}</h2>
            <p>{sections[currentSection].subtitle}</p>
          </div>
          
          {renderSection()}
        </motion.div>
      </AnimatePresence>

      <div className="assessment-controls">
        <button 
          className="btn-secondary"
          onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
          disabled={currentSection === 0}
        >
          Previous
        </button>
        
        <button 
          className="btn-primary"
          onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
          disabled={currentSection === sections.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Ethical Motivations Section Component
const EthicalMotivationsSection = ({ onComplete, data = {} }) => {
  const [formData, setFormData] = useState({
    animalRights: {
      primaryMotivation: data?.animalRights?.primaryMotivation || false,
      advocacyLevel: data?.animalRights?.advocacyLevel || 'passive',
      productConsciousness: {
        cosmetics: data?.animalRights?.productConsciousness?.cosmetics || 'not-considered',
        clothing: data?.animalRights?.productConsciousness?.clothing || 'not-considered',
        household: data?.animalRights?.productConsciousness?.household || 'not-considered'
      }
    },
    environmental: {
      primaryMotivation: data?.environmental?.primaryMotivation || false,
      carbonFootprintAwareness: data?.environmental?.carbonFootprintAwareness || 'unaware',
      sustainableLiving: data?.environmental?.sustainableLiving || 'minimal',
      climateActivism: data?.environmental?.climateActivism || 'none'
    },
    health: {
      primaryMotivation: data?.health?.primaryMotivation || false,
      nutritionKnowledge: data?.health?.nutritionKnowledge || 'basic',
      wellnessIntegration: data?.health?.wellnessIntegration || 'minimal'
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete('ethicalMotivations', formData);
  };

  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="assessment-form">
      <div className="form-section">
        <h3>🐾 Animal Rights</h3>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.animalRights.primaryMotivation}
            onChange={(e) => updateFormData('animalRights.primaryMotivation', e.target.checked)}
          />
          Animal rights is my primary motivation for being plant-based
        </label>

        <div className="form-group">
          <label>How involved are you in animal rights advocacy?</label>
          <select
            value={formData.animalRights.advocacyLevel}
            onChange={(e) => updateFormData('animalRights.advocacyLevel', e.target.value)}
          >
            <option value="passive">Passive supporter</option>
            <option value="moderate">Moderate involvement</option>
            <option value="active">Active advocate</option>
            <option value="leadership">Leadership role</option>
          </select>
        </div>

        <div className="product-consciousness">
          <label>How do you consider animal welfare in your product choices?</label>
          
          {['cosmetics', 'clothing', 'household'].map(category => (
            <div key={category} className="product-category">
              <span className="category-label">{category.charAt(0).toUpperCase() + category.slice(1)}:</span>
              <select
                value={formData.animalRights.productConsciousness[category]}
                onChange={(e) => updateFormData(`animalRights.productConsciousness.${category}`, e.target.value)}
              >
                <option value="not-considered">Don't consider</option>
                <option value="sometimes">Sometimes</option>
                <option value="always">Always</option>
                <option value="research-first">Research extensively</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>🌍 Environmental Consciousness</h3>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.environmental.primaryMotivation}
            onChange={(e) => updateFormData('environmental.primaryMotivation', e.target.checked)}
          />
          Environmental impact is my primary motivation for being plant-based
        </label>

        <div className="form-group">
          <label>How aware are you of your carbon footprint?</label>
          <select
            value={formData.environmental.carbonFootprintAwareness}
            onChange={(e) => updateFormData('environmental.carbonFootprintAwareness', e.target.value)}
          >
            <option value="unaware">Not really aware</option>
            <option value="aware">Generally aware</option>
            <option value="tracking">Actively tracking</option>
            <option value="optimizing">Actively optimizing</option>
          </select>
        </div>

        <div className="form-group">
          <label>How would you describe your sustainable living practices?</label>
          <select
            value={formData.environmental.sustainableLiving}
            onChange={(e) => updateFormData('environmental.sustainableLiving', e.target.value)}
          >
            <option value="minimal">Just getting started</option>
            <option value="moderate">Some practices in place</option>
            <option value="committed">Very committed</option>
            <option value="zealous">It's my lifestyle</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>💪 Health & Wellness</h3>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.health.primaryMotivation}
            onChange={(e) => updateFormData('health.primaryMotivation', e.target.checked)}
          />
          Health benefits are my primary motivation for being plant-based
        </label>

        <div className="form-group">
          <label>How would you rate your nutrition knowledge?</label>
          <select
            value={formData.health.nutritionKnowledge}
            onChange={(e) => updateFormData('health.nutritionKnowledge', e.target.value)}
          >
            <option value="basic">Basic understanding</option>
            <option value="intermediate">Good knowledge</option>
            <option value="advanced">Very knowledgeable</option>
            <option value="expert">Expert level</option>
          </select>
        </div>

        <div className="form-group">
          <label>How integrated is wellness into your lifestyle?</label>
          <select
            value={formData.health.wellnessIntegration}
            onChange={(e) => updateFormData('health.wellnessIntegration', e.target.value)}
          >
            <option value="minimal">Not a major focus</option>
            <option value="moderate">Somewhat important</option>
            <option value="high">Very important</option>
            <option value="lifestyle">Central to my life</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Complete Section
      </button>
    </form>
  );
};

// Placeholder components for other sections (to be implemented)
const LifestyleFactorsSection = ({ onComplete, data }) => (
  <div className="placeholder-section">
    <p>Lifestyle factors assessment coming soon...</p>
    <button onClick={() => onComplete('lifestyleFactors', {})} className="btn-primary">
      Skip for now
    </button>
  </div>
);

const JourneyStageSection = ({ onComplete, data }) => (
  <div className="placeholder-section">
    <p>Journey stage assessment coming soon...</p>
    <button onClick={() => onComplete('journeyStage', {})} className="btn-primary">
      Skip for now
    </button>
  </div>
);

const ValuesPreferencesSection = ({ onComplete, data }) => (
  <div className="placeholder-section">
    <p>Values preferences assessment coming soon...</p>
    <button onClick={() => onComplete('valuesPreferences', {})} className="btn-primary">
      Skip for now
    </button>
  </div>
);

const CulturalContextSection = ({ onComplete, data }) => (
  <div className="placeholder-section">
    <p>Cultural context assessment coming soon...</p>
    <button onClick={() => onComplete('culturalContext', {})} className="btn-primary">
      Complete Assessment
    </button>
  </div>
);

export default ValuesAssessment;