import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FilterModal.css';

const FilterModal = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      ageRange: { min: 18, max: 99 },
      distance: 50,
      dietaryPreference: 'all',
      cookingSkill: 'all',
      interests: [],
      yearsBased: { min: 0, max: 50 },
      lastActive: 'all'
    };
    setLocalFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="filter-overlay" onClick={onClose}>
        <motion.div 
          className="filter-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="filter-header">
            <h2>Filter Preferences</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="filter-content">
            {/* Age Range */}
            <div className="filter-section">
              <h3>Age Range</h3>
              <div className="range-inputs">
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={localFilters.ageRange.min}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    ageRange: { ...localFilters.ageRange, min: parseInt(e.target.value) }
                  })}
                />
                <span>to</span>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={localFilters.ageRange.max}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    ageRange: { ...localFilters.ageRange, max: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            {/* Distance */}
            <div className="filter-section">
              <h3>Distance: {localFilters.distance} miles</h3>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={localFilters.distance}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  distance: parseInt(e.target.value)
                })}
                className="distance-slider"
              />
            </div>

            {/* Dietary Preference */}
            <div className="filter-section">
              <h3>Dietary Preference</h3>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="dietary"
                    value="all"
                    checked={localFilters.dietaryPreference === 'all'}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dietaryPreference: e.target.value
                    })}
                  />
                  All Plant-Based
                </label>
                <label>
                  <input
                    type="radio"
                    name="dietary"
                    value="vegan"
                    checked={localFilters.dietaryPreference === 'vegan'}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dietaryPreference: e.target.value
                    })}
                  />
                  Vegan Only
                </label>
                <label>
                  <input
                    type="radio"
                    name="dietary"
                    value="vegetarian"
                    checked={localFilters.dietaryPreference === 'vegetarian'}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dietaryPreference: e.target.value
                    })}
                  />
                  Vegetarian Only
                </label>
              </div>
            </div>

            {/* Cooking Skill */}
            <div className="filter-section">
              <h3>Cooking Skill</h3>
              <select
                value={localFilters.cookingSkill}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  cookingSkill: e.target.value
                })}
              >
                <option value="all">Any Level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="chef-level">Chef Level</option>
              </select>
            </div>

            {/* Years Plant-Based */}
            <div className="filter-section">
              <h3>Years Plant-Based</h3>
              <div className="range-inputs">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={localFilters.yearsBased.min}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    yearsBased: { ...localFilters.yearsBased, min: parseInt(e.target.value) }
                  })}
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={localFilters.yearsBased.max}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    yearsBased: { ...localFilters.yearsBased, max: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            {/* Last Active */}
            <div className="filter-section">
              <h3>Last Active</h3>
              <select
                value={localFilters.lastActive}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  lastActive: e.target.value
                })}
              >
                <option value="all">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-secondary" onClick={handleReset}>
              Reset Filters
            </button>
            <button className="btn-primary" onClick={handleApply}>
              Apply Filters
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FilterModal;