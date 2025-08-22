import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Restaurants from './pages/Restaurants';
import Events from './pages/Events';
import VideoChat from './pages/VideoChat';
import VideoCallNotification from './components/VideoCallNotification';
import { registerServiceWorker, initializeNotifications } from './utils/notifications';
import './styles/global.css';
import './styles/dark-mode.css';

function App() {
  useEffect(() => {
    // Initialize service worker and notifications
    const init = async () => {
      const registration = await registerServiceWorker();
      if (registration) {
        await initializeNotifications();
      }
    };
    init();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <div className="app">
                <Navbar />
                <VideoCallNotification />
                <ThemeToggle />
                <Toaster 
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--black)',
                    color: 'var(--white)',
                    borderRadius: '10px',
                    padding: '16px 24px',
                    fontSize: '16px',
                  },
                  success: {
                    style: {
                      background: 'var(--green)',
                    },
                  },
                  error: {
                    style: {
                      background: '#ff4444',
                    },
                  },
                }}
              />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/browse" element={
                  <PrivateRoute verified>
                    <Browse />
                  </PrivateRoute>
                } />
                <Route path="/matches" element={
                  <PrivateRoute verified>
                    <Matches />
                  </PrivateRoute>
                } />
                <Route path="/messages/:matchId?" element={
                  <PrivateRoute verified>
                    <Messages />
                  </PrivateRoute>
                } />
                <Route path="/profile/:userId?" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="/restaurants" element={
                  <PrivateRoute verified>
                    <Restaurants />
                  </PrivateRoute>
                } />
                <Route path="/events" element={
                  <PrivateRoute verified>
                    <Events />
                  </PrivateRoute>
                } />
                <Route path="/video/:roomId" element={
                  <PrivateRoute verified>
                    <VideoChat />
                  </PrivateRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App
