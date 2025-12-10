
// src/components/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  // Show a loading placeholder while AuthContext/SWR initializes
   if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading…
      </div>
    );
  }

  // If not authenticated, redirect to /login and remember where we came from
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated: render the protected children
  return children;
}