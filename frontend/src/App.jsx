import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="app">
            <Navbar />
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App
