import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyEmailPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid or missing verification token.');
        setLoading(false);
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setSuccess(response.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Email verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: '20px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
  };

  const successStyle: React.CSSProperties = {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
  };

  const loadingStyle: React.CSSProperties = {
    color: '#3498db',
    fontSize: '18px',
    marginTop: '20px',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          Email Verification
        </h1>

        {loading && (
          <div style={loadingStyle}>
            <p>Verifying your email...</p>
          </div>
        )}

        {error && (
          <>
            <div style={errorStyle}>{error}</div>
            <p style={{ marginTop: '20px' }}>
              <Link to="/login" style={{ color: '#3498db', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </p>
          </>
        )}

        {success && (
          <>
            <div style={successStyle}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>✓</div>
              <div>{success}</div>
            </div>
            <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
