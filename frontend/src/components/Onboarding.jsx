import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Onboarding.css';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Planted! 🌱',
    content: 'Find meaningful connections with people who share your plant-based values.',
    icon: '👋'
  },
  {
    id: 'swipe',
    title: 'Swipe to Connect',
    content: '❌ Pass on someone\n💚 Like their profile\n⭐ Super like for extra attention',
    icon: '👆'
  },
  {
    id: 'match',
    title: 'Match & Chat',
    content: 'When you both like each other, it\'s a match! Start chatting and plan your plant-based date.',
    icon: '💬'
  },
  {
    id: 'values',
    title: 'Share Your Journey',
    content: 'Every member is verified vegan or vegetarian. No more awkward "why don\'t you eat meat?" conversations!',
    icon: '🌿'
  },
  {
    id: 'ready',
    title: 'Ready to Find Love?',
    content: 'Complete your profile and start browsing amazing plant-based singles in your area.',
    icon: '💚'
  }
];

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('plantedOnboardingComplete');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('plantedOnboardingComplete', 'true');
    setIsVisible(false);
    onComplete && onComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay">
      <motion.div 
        className="onboarding-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button className="skip-button" onClick={handleSkip}>
          Skip
        </button>

        <div className="onboarding-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              <div className="step-icon">{step.icon}</div>
              <h2>{step.title}</h2>
              <p>{step.content}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="onboarding-navigation">
          <div className="progress-dots">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <button className="btn-primary" onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;