import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">Planted</span>
          </Link>

          <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/browse" className="nav-link">Browse</Link>
                <Link to="/matches" className="nav-link">Matches</Link>
                <Link to="/messages" className="nav-link">Messages</Link>
                <Link to="/restaurants" className="nav-link">Restaurants</Link>
                <Link to="/events" className="nav-link">Events</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                <button onClick={handleLogout} className="nav-link logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link btn-primary small">
                  Apply to Join
                </Link>
              </>
            )}
          </div>

          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;