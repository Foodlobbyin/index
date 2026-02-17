import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
