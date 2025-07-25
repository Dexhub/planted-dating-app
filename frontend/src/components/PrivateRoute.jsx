import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, verified = false }) => {
  const { isAuthenticated, isVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (verified && !isVerified) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;