import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProgressiveImage from '../components/ProgressiveImage';
import './Events.css';

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: 'Vegan Cooking Class for Couples',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    location: 'Green Kitchen Studio, San Francisco',
    description: 'Learn to cook delicious plant-based meals together. Perfect for date night!',
    attendees: 12,
    maxAttendees: 20,
    price: 50,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    type: 'cooking',
    host: 'Chef Maria Green'
  },
  {
    id: 2,
    title: 'Plant-Based Speed Dating',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: '7:30 PM',
    location: 'The Herbivore Lounge, San Francisco',
    description: 'Meet multiple potential matches in one fun evening. All attendees are verified Planted members!',
    attendees: 28,
    maxAttendees: 30,
    price: 25,
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    type: 'dating',
    host: 'Planted Team'
  },
  {
    id: 3,
    title: 'Farmers Market Tour & Picnic',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '10:00 AM',
    location: 'Ferry Building, San Francisco',
    description: 'Explore local organic produce and enjoy a plant-based picnic in the park.',
    attendees: 8,
    maxAttendees: 15,
    price: 15,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400',
    type: 'social',
    host: 'Planted Community'
  }
];

const Events = () => {
  const [events, setEvents] = useState(mockEvents);
  const [filter, setFilter] = useState('all');
  const [myEvents, setMyEvents] = useState([]);

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.type === filter
  );

  const handleRSVP = (eventId) => {
    if (myEvents.includes(eventId)) {
      setMyEvents(myEvents.filter(id => id !== eventId));
    } else {
      setMyEvents([...myEvents, eventId]);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSpotsLeft = (event) => {
    return event.maxAttendees - event.attendees;
  };

  return (
    <div className="events">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="events-header">
            <h1>Plant-Based Events & Meetups</h1>
            <p>Connect with the community beyond the app</p>
          </div>

          <div className="events-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Events
            </button>
            <button 
              className={`filter-btn ${filter === 'cooking' ? 'active' : ''}`}
              onClick={() => setFilter('cooking')}
            >
              Cooking Classes
            </button>
            <button 
              className={`filter-btn ${filter === 'dating' ? 'active' : ''}`}
              onClick={() => setFilter('dating')}
            >
              Dating Events
            </button>
            <button 
              className={`filter-btn ${filter === 'social' ? 'active' : ''}`}
              onClick={() => setFilter('social')}
            >
              Social Meetups
            </button>
          </div>

          <div className="events-grid">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                className="event-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="event-image">
                  <ProgressiveImage
                    src={event.image}
                    alt={event.title}
                  />
                  {getSpotsLeft(event) < 5 && (
                    <div className="spots-badge">
                      Only {getSpotsLeft(event)} spots left!
                    </div>
                  )}
                </div>

                <div className="event-content">
                  <div className="event-date">
                    <span className="date-day">{event.date.getDate()}</span>
                    <span className="date-month">
                      {event.date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>

                  <div className="event-info">
                    <h3>{event.title}</h3>
                    <p className="event-time">
                      {formatDate(event.date)} at {event.time}
                    </p>
                    <p className="event-location">📍 {event.location}</p>
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-meta">
                      <span className="event-host">Hosted by {event.host}</span>
                      <span className="event-attendees">
                        {event.attendees} attending
                      </span>
                    </div>

                    <div className="event-footer">
                      <span className="event-price">${event.price}</span>
                      <button 
                        className={`btn-primary small ${myEvents.includes(event.id) ? 'attending' : ''}`}
                        onClick={() => handleRSVP(event.id)}
                      >
                        {myEvents.includes(event.id) ? 'Cancel RSVP' : 'RSVP'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="events-cta">
            <h2>Want to Host an Event?</h2>
            <p>Bring the Planted community together with your own event idea!</p>
            <button className="btn-primary">
              Submit Event Proposal
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Events;