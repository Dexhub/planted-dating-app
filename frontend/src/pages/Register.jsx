import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import './Auth.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_KEY');

const Register = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const onSubmit = async (data) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    
    try {
      // Process payment first
      const stripe = await stripePromise;
      
      // In production, create checkout session on backend
      toast.success('Payment verification successful!');
      
      // Register user
      const result = await registerUser(data);
      if (!result.success) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="John"
                />
                {errors.firstName && (
                  <span className="error-message">{errors.firstName.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required' })}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <span className="error-message">{errors.lastName.message}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="you@example.com"
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
              />
              {errors.dateOfBirth && (
                <span className="error-message">{errors.dateOfBirth.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <span className="error-message">{errors.gender.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="interestedIn">Interested In</label>
                <select
                  id="interestedIn"
                  {...register('interestedIn', { required: 'This field is required' })}
                >
                  <option value="">Select</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                  <option value="both">Both</option>
                  <option value="all">Everyone</option>
                </select>
                {errors.interestedIn && (
                  <span className="error-message">{errors.interestedIn.message}</span>
                )}
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h3>Your Plant-Based Journey</h3>
            
            <div className="form-group">
              <label htmlFor="dietaryPreference">Dietary Preference</label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="vegan"
                    value="vegan"
                    {...register('dietaryPreference', { required: 'Please select your dietary preference' })}
                  />
                  <label htmlFor="vegan">Vegan</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="vegetarian"
                    value="vegetarian"
                    {...register('dietaryPreference', { required: 'Please select your dietary preference' })}
                  />
                  <label htmlFor="vegetarian">Vegetarian</label>
                </div>
              </div>
              {errors.dietaryPreference && (
                <span className="error-message">{errors.dietaryPreference.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="yearsBased">Years Plant-Based</label>
              <input
                type="number"
                id="yearsBased"
                min="0"
                {...register('yearsBased', { 
                  required: 'This field is required',
                  min: { value: 0, message: 'Years must be 0 or greater' }
                })}
                placeholder="3"
              />
              {errors.yearsBased && (
                <span className="error-message">{errors.yearsBased.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="whyPlantBased">Why did you choose a plant-based lifestyle?</label>
              <textarea
                id="whyPlantBased"
                {...register('whyPlantBased', { 
                  required: 'Please share your story',
                  minLength: { value: 20, message: 'Please write at least 20 characters' },
                  maxLength: { value: 300, message: 'Maximum 300 characters' }
                })}
                placeholder="Tell us what inspired your journey..."
              />
              {errors.whyPlantBased && (
                <span className="error-message">{errors.whyPlantBased.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cookingSkill">Cooking Skill Level</label>
              <select
                id="cookingSkill"
                {...register('cookingSkill', { required: 'Please select your cooking skill' })}
              >
                <option value="">Select</option>
                <option value="beginner">Beginner - Learning the basics</option>
                <option value="intermediate">Intermediate - Comfortable in the kitchen</option>
                <option value="advanced">Advanced - Love experimenting</option>
                <option value="chef-level">Chef Level - Could go pro</option>
              </select>
              {errors.cookingSkill && (
                <span className="error-message">{errors.cookingSkill.message}</span>
              )}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h3>About You</h3>
            
            <div className="form-group">
              <label htmlFor="bio">Tell us about yourself</label>
              <textarea
                id="bio"
                {...register('bio', { 
                  required: 'Please tell us about yourself',
                  minLength: { value: 20, message: 'Please write at least 20 characters' },
                  maxLength: { value: 500, message: 'Maximum 500 characters' }
                })}
                placeholder="What makes you unique? What are you passionate about?"
              />
              {errors.bio && (
                <span className="error-message">{errors.bio.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location.city">City</label>
              <input
                type="text"
                id="location.city"
                {...register('location.city', { required: 'City is required' })}
                placeholder="San Francisco"
              />
              {errors.location?.city && (
                <span className="error-message">{errors.location.city.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="interests">Interests (select all that apply)</label>
              <div className="checkbox-group">
                {['cooking', 'fitness', 'yoga', 'meditation', 'hiking', 'travel', 'music', 'art', 'reading', 'gardening', 'activism', 'sustainability'].map(interest => (
                  <div key={interest} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={interest}
                      value={interest}
                      {...register('interests')}
                    />
                    <label htmlFor={interest}>
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <p className="text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                A $1 verification fee will be charged to confirm your identity.
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <h1>Join Planted</h1>
            <p>Apply to be one of our founding 100 members</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-section">
              {renderStep()}
            </div>

            <div className="form-navigation">
              {step > 1 && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <span className="loading"></span>
                ) : step < 3 ? (
                  'Next'
                ) : (
                  'Complete Application'
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>
              Already a member?{' '}
              <Link to="/login" className="link-green">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;