import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import AdminQueue from './AdminQueue';
import AdminUsers from './AdminUsers';
import AdminInvites from './AdminInvites';
import AdminProfile from './AdminProfile';
import AdminModerationPage from './AdminModerationPage';

// Note: Moderation is kept accessible via direct URL (/admin/moderation)
// but not shown in the admin sidebar — moderators use the separate Moderator panel.
// Admin sidebar covers: Dashboard, Queue, Users, Invites, My Profile.

const NAV = [
  { path: '/admin',          label: 'Dashboard',  exact: true },
  { path: '/admin/queue',    label: 'Queue',       exact: true },
  { path: '/admin/users',    label: 'Users',       exact: true },
  { path: '/admin/invites',  label: 'Invites',     exact: true },
  { path: '/admin/profile',  label: 'My Profile',  exact: true },
];

export default function AdminPanel(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.trust_level === 'admin') {
          setAuthorized(true);
          api.get('/auth/profile').then(res => {
            const fresh = res.data?.user ?? res.data;
            if (fresh?.trust_level !== 'admin') {
              setAuthorized(false);
              navigate('/dashboard');
            } else {
              localStorage.setItem('user', JSON.stringify(fresh));
            }
          }).catch(() => { /* keep localStorage-based grant on network error */ });
          return;
        }
      } catch (_) { /* ignore malformed JSON */ }
    }

    api.get('/auth/profile').then(res => {
      const u = res.data?.user ?? res.data;
      if (u?.trust_level === 'admin') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/dashboard');
      }
    }).catch(err => {
      setAuthorized(false);
      navigate(err?.response?.status === 401 ? '/login' : '/login');
    });
  }, []);

  if (authorized === null) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        Verifying access...
      </div>
    );
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path + '/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>

      {/* Sidebar */}
      <div style={{
        width: 200, backgroundColor: '#15803d', color: 'white',
        padding: '20px 0', flexShrink: 0, display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 18px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Foodlobby</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</p>
        </div>

        {/* Nav links */}
        <nav style={{ marginTop: 12, flex: 1 }}>
          {NAV.map(({ path, label, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'block', padding: '9px 18px', fontSize: 13,
                  color: active ? 'white' : 'rgba(255,255,255,0.65)',
                  backgroundColor: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                  textDecoration: 'none', fontWeight: active ? 600 : 400,
                  borderLeft: active ? '3px solid white' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a
            href="/app"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none' }}
          >
            ← Back to App
          </a>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.75)', borderRadius: 6, padding: '6px 12px',
              fontSize: 12, cursor: 'pointer', textAlign: 'left',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="queue" element={<AdminQueue />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="invites" element={<AdminInvites />} />
          <Route path="profile" element={<AdminProfile />} />
          {/* Moderation accessible via direct URL for admin use if needed */}
          <Route path="moderation" element={<AdminModerationPage />} />
        </Routes>
      </div>
    </div>
  );
}
