import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProgressiveImage from '../components/ProgressiveImage';
import './Restaurants.css';

// Mock data for demo - in production, use Google Places API
const mockRestaurants = [
  {
    id: 1,
    name: 'Green Garden Cafe',
    type: 'Vegan',
    rating: 4.8,
    priceLevel: 2,
    distance: 0.5,
    address: '123 Plant St, San Francisco',
    cuisine: 'American, Healthy',
    image: 'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=400',
    features: ['Outdoor Seating', 'Romantic', 'Cozy']
  },
  {
    id: 2,
    name: 'The Herbivore Kitchen',
    type: 'Vegetarian',
    rating: 4.6,
    priceLevel: 3,
    distance: 1.2,
    address: '456 Veggie Ave, San Francisco',
    cuisine: 'Mediterranean, Italian',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    features: ['Date Night', 'Wine Bar', 'Live Music']
  },
  {
    id: 3,
    name: 'Plant Power Fast Food',
    type: 'Vegan',
    rating: 4.5,
    priceLevel: 1,
    distance: 2.3,
    address: '789 Green Blvd, San Francisco',
    cuisine: 'Fast Food, American',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    features: ['Quick Bite', 'Casual', 'Family Friendly']
  }
];

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const filteredRestaurants = restaurants
    .filter(r => filter === 'all' || r.type.toLowerCase() === filter)
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.priceLevel - b.priceLevel;
      return 0;
    });

  const getPriceSymbol = (level) => '$'.repeat(level);

  return (
    <div className="restaurants">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="restaurants-header">
            <h1>Plant-Based Date Spots 🌿</h1>
            <p>Find the perfect restaurant for your next date</p>
          </div>

          <div className="restaurants-filters">
            <div className="filter-group">
              <label>Type</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="vegan">Vegan Only</option>
                <option value="vegetarian">Vegetarian</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>

          <div className="restaurants-grid">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                className="restaurant-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="restaurant-image">
                  <ProgressiveImage
                    src={restaurant.image}
                    alt={restaurant.name}
                  />
                  <div className="restaurant-badge">
                    {restaurant.type}
                  </div>
                </div>

                <div className="restaurant-info">
                  <div className="restaurant-header">
                    <h3>{restaurant.name}</h3>
                    <span className="price">{getPriceSymbol(restaurant.priceLevel)}</span>
                  </div>

                  <div className="restaurant-meta">
                    <span className="rating">⭐ {restaurant.rating}</span>
                    <span className="distance">📍 {restaurant.distance} mi</span>
                  </div>

                  <p className="cuisine">{restaurant.cuisine}</p>
                  <p className="address">{restaurant.address}</p>

                  <div className="restaurant-features">
                    {restaurant.features.map(feature => (
                      <span key={feature} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="restaurant-actions">
                    <button className="btn-primary small">
                      View Details
                    </button>
                    <button className="btn-secondary small">
                      Share with Match
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="restaurants-map">
            <h2>Restaurants Near You</h2>
            <div className="map-placeholder">
              <p>🗺️ Interactive map would go here</p>
              <p className="map-note">
                In production, this would show an interactive map with all restaurant locations
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Restaurants;