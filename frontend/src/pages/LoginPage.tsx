import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, LoginData } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      login(response.token, response.user);
      navigate('/app');
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
      login(response.token, response.user);
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        <Card>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                loginMethod === 'password'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setLoginMethod('password');
                setError('');
                setSuccess('');
              }}
            >
              Password
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                loginMethod === 'otp'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setLoginMethod('otp');
                setError('');
                setSuccess('');
                setOtpSent(false);
              }}
            >
              Email OTP
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Password Login */}
          {loginMethod === 'password' && (
            <>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <Input
                  type="text"
                  name="username"
                  label="Mobile Number or Username"
                  placeholder="Enter your mobile number or username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  fullWidth
                />
                <Input
                  type="password"
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  fullWidth
                />
                <Button type="submit" isLoading={loading} fullWidth>
                  Sign In
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot your password?
                </Link>
              </div>
            </>
          )}

          {/* OTP Login */}
          {loginMethod === 'otp' && (
            <>
              {!otpSent ? (
                <div className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    fullWidth
                  />
                  <Button
                    type="button"
                    onClick={handleRequestOTP}
                    isLoading={loading}
                    disabled={!email}
                    fullWidth
                  >
                    Send OTP
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    We'll send a 6-digit code to your email
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOTPLogin} className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    value={email}
                    disabled
                    fullWidth
                  />
                  <Input
                    type="text"
                    label="OTP Code"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    disabled={loading}
                    fullWidth
                    helperText="Check your email for the verification code"
                  />
                  <Button
                    type="submit"
                    isLoading={loading}
                    disabled={otp.length !== 6}
                    fullWidth
                  >
                    Verify & Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError('');
                      setSuccess('');
                    }}
                    disabled={loading}
                    fullWidth
                  >
                    Use Different Email
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </Link>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
