import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyOTPPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const inviteType = searchParams.get('type'); // 'marketing' | 'member'

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/secure-auth/verify-otp', { email, otp });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Marketing invite → immediate access
      // Member invite → pending review
      if (inviteType === 'member' || user.registration_status === 'pending_review') {
        navigate('/pending-review');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(''); setResendLoading(true);
    try {
      await api.post('/secure-auth/request-otp', { email });
      setResendMsg('A new OTP has been sent to your email.');
    } catch (err: any) {
      setResendMsg(err.response?.data?.error || 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const card: React.CSSProperties = {
    backgroundColor: 'white', padding: '40px 36px', borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400,
    textAlign: 'center',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 24 }}>
      <div style={card}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
        <h2 style={{ color: '#15803d', marginBottom: 8 }}>Verify Your Email</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          We sent a 6-digit code to<br />
          <strong>{email}</strong>
        </p>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 10, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{
              width: '100%', padding: '14px', textAlign: 'center', fontSize: 22,
              letterSpacing: 8, border: '2px solid #d1d5db', borderRadius: 8,
              boxSizing: 'border-box', marginBottom: 16, outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: (loading || otp.length < 6) ? '#9ca3af' : '#16a34a',
              color: 'white', border: 'none', borderRadius: 6,
              fontSize: 15, fontWeight: 600,
              cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 13 }}>
          <span style={{ color: '#6b7280' }}>Didn't receive it? </span>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>

        {resendMsg && <p style={{ marginTop: 8, fontSize: 13, color: resendMsg.includes('sent') ? '#16a34a' : '#dc2626' }}>{resendMsg}</p>}

        <p style={{ marginTop: 20, fontSize: 12, color: '#9ca3af' }}>
          Wrong email? <Link to="/register" style={{ color: '#16a34a' }}>Go back</Link>
        </p>
      </div>
    </div>
  );
}
