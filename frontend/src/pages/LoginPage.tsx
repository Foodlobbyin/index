import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, LoginData } from '../services/authService';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [formData, setFormData] = useState<LoginData>({
    username: '',
    password: '',
  });
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.requestEmailOTP(email);
      setSuccess(response.message);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginWithEmailOTP({ email, otp });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: '20px',
  };

  const formContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    marginBottom: '10px',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#95a5a6',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const successStyle: React.CSSProperties = {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    backgroundColor: active ? '#3498db' : '#ecf0f1',
    color: active ? 'white' : '#7f8c8d',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
  });

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
          Foodlobbyin
        </h1>
        <h2 style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px', fontSize: '18px' }}>
          Login to Your Account
        </h2>

        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <button
            style={tabStyle(loginMethod === 'password')}
            onClick={() => {
              setLoginMethod('password');
              setError('');
              setSuccess('');
            }}
          >
            Password Login
          </button>
          <button
            style={tabStyle(loginMethod === 'otp')}
            onClick={() => {
              setLoginMethod('otp');
              setError('');
              setSuccess('');
              setOtpSent(false);
            }}
          >
            Email OTP Login
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        {loginMethod === 'password' ? (
          <>
            <form onSubmit={handlePasswordLogin}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={loading}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={loading}
              />
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              <Link to="/forgot-password" style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
                Forgot Password?
              </Link>
            </p>
          </>
        ) : (
          <>
            {!otpSent ? (
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  style={buttonStyle}
                  disabled={loading || !email}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOTPLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  disabled
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  style={inputStyle}
                  disabled={loading}
                />
                <button type="submit" style={buttonStyle} disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                    setSuccess('');
                  }}
                  style={secondaryButtonStyle}
                  disabled={loading}
                >
                  Use Different Email
                </button>
              </form>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#7f8c8d' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#3498db', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
