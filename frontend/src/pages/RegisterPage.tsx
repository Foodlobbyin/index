import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { inviteService } from '../services/inviteService';

type Mode = 'loading' | 'invalid_invite' | 'expired_invite' | 'register' | 'waitlist';

export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [mode, setMode] = useState<Mode>('loading');
  const [lockedEmail, setLockedEmail] = useState('');
  const [inviteType, setInviteType] = useState<'marketing' | 'member' | null>(null);
  const [expiredToken, setExpiredToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reinviteRequested, setReinviteRequested] = useState(false);

  // Register form
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '',
    email: '', phone_number: '', gstn: '',
    password: '', confirm_password: '',
  });

  // Waitlist form
  const [waitlistForm, setWaitlistForm] = useState({
    first_name: '', last_name: '', email: '',
    mobile_number: '', gstn: '', business_description: '',
  });

  useEffect(() => {
    if (!inviteToken) {
      setMode('waitlist');
      return;
    }
    inviteService.validate(inviteToken).then((res) => {
      if (res.valid) {
        setLockedEmail(res.invited_email!);
        setInviteType(res.type!);
        setForm(f => ({ ...f, email: res.invited_email! }));
        setMode('register');
      } else if (res.error?.includes('expired')) {
        setExpiredToken(inviteToken);
        setMode('expired_invite');
      } else {
        setMode('invalid_invite');
      }
    });
  }, [inviteToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleWaitlistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setWaitlistForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/secure-auth/register', { ...form, invite_token: inviteToken });
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}&type=${inviteType}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/waitlist/join', waitlistForm);
      setSuccess('You have been added to the waitlist! Our team will reach out if you are a good fit for the community.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join waitlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleReinviteRequest = async () => {
    setLoading(true);
    try {
      await inviteService.requestReinvite(expiredToken);
      setReinviteRequested(true);
    } catch {
      setError('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', marginBottom: '12px',
    border: '1px solid #d1d5db', borderRadius: '6px',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  };
  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: '100%', padding: '12px', backgroundColor: disabled ? '#9ca3af' : '#16a34a',
    color: 'white', border: 'none', borderRadius: '6px',
    fontSize: '15px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  });
  const card: React.CSSProperties = {
    backgroundColor: 'white', padding: '36px 32px', borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px',
  };
  const wrap: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#f0fdf4', padding: '24px',
  };

  if (mode === 'loading') {
    return <div style={wrap}><div style={card}><p style={{ textAlign: 'center', color: '#6b7280' }}>Validating invite...</p></div></div>;
  }

  if (mode === 'invalid_invite') {
    return (
      <div style={wrap}><div style={card}>
        <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Invalid Invite</h2>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>This invite link is invalid or has already been used.</p>
        <Link to="/register" style={{ color: '#16a34a' }}>Join the waitlist instead</Link>
      </div></div>
    );
  }

  if (mode === 'expired_invite') {
    return (
      <div style={wrap}><div style={card}>
        <h2 style={{ color: '#d97706', marginBottom: 12 }}>Invite Expired</h2>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>This invite link has expired. You can request a new one.</p>
        {reinviteRequested
          ? <p style={{ color: '#16a34a', fontWeight: 600 }}>Request sent! You will receive a new invite soon.</p>
          : <button onClick={handleReinviteRequest} disabled={loading} style={btnStyle(loading)}>
              {loading ? 'Sending...' : 'Request New Invite'}
            </button>
        }
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
      </div></div>
    );
  }

  if (mode === 'waitlist') {
    return (
      <div style={wrap}><div style={{ ...card, maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <img src="/logo-mark.png" alt="FoodLobby" style={{ height: 56, width: 'auto' }} />
            <img src="/logo-wordmark.png" alt="FoodLobby" style={{ height: 34, width: 'auto' }} />
          </div>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
            FoodLobby is invite-only. Join the waitlist and our team will reach out if you are a good fit.
          </p>
        </div>
        {success
          ? <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16, color: '#15803d' }}>{success}</div>
          : (
            <form onSubmit={handleWaitlist}>
              {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 10, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <input name="first_name" placeholder="First Name *" value={waitlistForm.first_name} onChange={handleWaitlistChange} required style={{ ...inputStyle, marginBottom: 0 }} />
                <input name="last_name" placeholder="Last Name" value={waitlistForm.last_name} onChange={handleWaitlistChange} style={{ ...inputStyle, marginBottom: 0 }} />
              </div>
              <div style={{ marginBottom: 12 }} />
              <input name="email" type="email" placeholder="Email *" value={waitlistForm.email} onChange={handleWaitlistChange} required style={inputStyle} />
              <input name="mobile_number" type="tel" placeholder="Mobile Number" value={waitlistForm.mobile_number} onChange={handleWaitlistChange} style={inputStyle} />
              <input name="gstn" placeholder="GSTN (if registered)" value={waitlistForm.gstn} onChange={handleWaitlistChange} style={inputStyle} />
              <textarea name="business_description" placeholder="Brief description of your business *" value={waitlistForm.business_description} onChange={handleWaitlistChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          )
        }
        <p style={{ textAlign: 'center', marginTop: 16, color: '#9ca3af', fontSize: 13 }}>
          Already have an account? <Link to="/login" style={{ color: '#16a34a' }}>Login</Link>
        </p>
      </div></div>
    );
  }

  // Register mode (with valid invite)
  return (
    <div style={wrap}><div style={{ ...card, maxWidth: 500 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#15803d', fontSize: 22, fontWeight: 700 }}>Create Your Account</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>
          {inviteType === 'marketing' ? 'You have been invited by the Foodlobby team.' : 'You have been invited by a community member.'}
        </p>
      </div>

      {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 10, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleRegister}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input name="first_name" placeholder="First Name *" value={form.first_name} onChange={handleChange} required style={{ ...inputStyle, marginBottom: 0 }} />
          <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
        <div style={{ marginBottom: 12 }} />
        <input name="username" placeholder="Username *" value={form.username} onChange={handleChange} required style={inputStyle} />
        <div style={{ position: 'relative' }}>
          <input name="email" type="email" value={lockedEmail} readOnly style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-65%)', fontSize: 11, color: '#9ca3af' }}>Locked to invite</span>
        </div>
        <input name="phone_number" type="tel" placeholder="Phone Number * (e.g. 9876543210)" value={form.phone_number} onChange={handleChange} required style={inputStyle} />
        <input name="gstn" placeholder="GSTN * (15-digit)" value={form.gstn} onChange={handleChange} required style={inputStyle} maxLength={15} />
        <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} required style={inputStyle} minLength={8} />
        <input name="confirm_password" type="password" placeholder="Confirm Password *" value={form.confirm_password} onChange={handleChange} required style={inputStyle} />
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'Registering...' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, color: '#9ca3af', fontSize: 13 }}>
        Already have an account? <Link to="/login" style={{ color: '#16a34a' }}>Login</Link>
      </p>
    </div></div>
  );
}
