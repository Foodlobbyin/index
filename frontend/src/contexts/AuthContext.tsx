import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            // Add a 5-second timeout so the page doesn't hang if backend is unreachable
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Auth check timeout')), 5000)
            );
            const profileResult = await Promise.race([authService.getProfile(), timeoutPromise]) as { user: any };
            setUser(profileResult?.user ?? profileResult);
          } catch (error: any) {
            // Only invalidate the session on a definitive 401 from the server.
            // Network errors, timeouts, or 5xx should NOT log the user out.
            const status = error?.response?.status;
            if (status === 401) {
              authService.logout();
              setIsAuthenticated(false);
            } else {
              // Keep the token — load user from localStorage as fallback
              const stored = localStorage.getItem('user');
              if (stored) {
                try { setUser(JSON.parse(stored)); } catch (_) { /* ignore */ }
              }
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
    setUser(user);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
