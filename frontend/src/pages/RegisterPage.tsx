import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, RegisterData } from '../services/authService';

export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    mobile_number: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.register(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (response.message) {
        setSuccess(response.message);
        // Navigate after showing success message
        setTimeout(() => navigate('/'), 2000);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
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

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
          Foodlobbyin
        </h1>
        <h2 style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px', fontSize: '18px' }}>
          Create Your Account
        </h2>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username *"
            value={formData.username}
            onChange={handleChange}
            required
            style={inputStyle}
            disabled={loading}
          />
          <input
            type="tel"
            name="mobile_number"
            placeholder="Mobile Number * (e.g., +1234567890)"
            value={formData.mobile_number}
            onChange={handleChange}
            required
            style={inputStyle}
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
            disabled={loading}
          />
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            style={inputStyle}
            disabled={loading}
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            style={inputStyle}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (optional for OTP-only login)"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            disabled={loading}
            minLength={6}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#7f8c8d' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3498db', textDecoration: 'none' }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
