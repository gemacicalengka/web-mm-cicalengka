import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authUtils } from "../utils/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on component mount
    if (!authUtils.isAuthenticated()) {
      navigate('/');  // Redirect to login (index route)
      return;
    }

    // Set up interval to check session expiration
    const checkSession = () => {
      if (!authUtils.isAuthenticated()) {
        navigate('/login');
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  // If not authenticated, don't render children
  if (!authUtils.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}