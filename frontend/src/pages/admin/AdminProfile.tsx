import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminProfile(): JSX.Element {
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      const u = res.data.user;
      setProfile(u);
      setUsername(u.username || '');
      setEmail(u.email || '');
    }).catch(() => showToast('Failed to load profile', false));
  }, []);

  const saveProfile = async () => {
    if (!username.trim() || !email.trim()) {
      return showToast('Username and email are required', false);
    }
    setSavingProfile(true);
    try {
      await api.patch('/admin/profile', { username, email });
      setProfile((p: any) => ({ ...p, username, email }));
      showToast('Profile updated successfully');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update profile', false);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showToast('All password fields are required', false);
    }
    if (newPassword !== confirmPassword) {
      return showToast('New passwords do not match', false);
    }
    if (newPassword.length < 10) {
      return showToast('Password must be at least 10 characters', false);
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      return showToast('Password needs 1 uppercase, 1 number, 1 special character', false);
    }
    setSavingPassword(true);
    try {
      await api.patch('/admin/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to change password', false);
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 7,
    border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', backgroundColor: 'white',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#374151', marginBottom: 5,
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 28, marginBottom: 24,
  };
  const btnStyle = (loading: boolean): React.CSSProperties => ({
    padding: '10px 24px', borderRadius: 7, border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    backgroundColor: loading ? '#86efac' : '#15803d',
    color: 'white', fontWeight: 600, fontSize: 14,
    opacity: loading ? 0.7 : 1, marginTop: 8,
  });

  return (
    <div style={{ maxWidth: 560 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, color: 'white', fontWeight: 500,
          backgroundColor: toast.ok ? '#16a34a' : '#dc2626',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>My Profile</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Manage your admin account credentials.
        </p>
      </div>

      {/* Current info badge */}
      {profile && (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 10, padding: '14px 18px', marginBottom: 24,
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Username</span>
            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#15803d' }}>{profile.username}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Email</span>
            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#15803d' }}>{profile.email}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Trust Level</span>
            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#7c3aed' }}>{profile.trust_level}</p>
          </div>
        </div>
      )}

      {/* Update username / email */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Update Username &amp; Email
        </h2>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="your_username"
            style={inputStyle}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
            Letters, numbers, underscores only. 3–50 characters.
          </p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@yourdomain.com"
            style={inputStyle}
          />
        </div>
        <button onClick={saveProfile} disabled={savingProfile} style={btnStyle(savingProfile)}>
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Change Password
        </h2>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••••"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••••"
            style={inputStyle}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
            Min 10 chars · 1 uppercase · 1 number · 1 special character
          </p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••••"
            style={inputStyle}
          />
        </div>
        <button onClick={savePassword} disabled={savingPassword} style={btnStyle(savingPassword)}>
          {savingPassword ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
