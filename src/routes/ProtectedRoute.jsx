// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Wrap any route you want protected:
 * <ProtectedRoute roles={["jobseeker","employer"]}><Component/></ProtectedRoute>
 * If roles is empty, it only requires the user to be logged in.
 */
export default function ProtectedRoute({ roles = [], children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  // Not logged in → send to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role not allowed
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
