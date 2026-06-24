import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import AdminPending from './AdminPending';
import AdminWaitlist from './AdminWaitlist';
import AdminUsers from './AdminUsers';
import AdminInvites from './AdminInvites';
import AdminProfile from './AdminProfile';
import AdminModerationPage from './AdminModerationPage';

const NAV = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/moderation', label: '🛡️ Moderation', exact: true },
  { path: '/admin/pending', label: '⏳ Pending Review', exact: true },
  { path: '/admin/waitlist', label: '📋 Waitlist', exact: true },
  { path: '/admin/users', label: '👥 Users', exact: true },
  { path: '/admin/invites', label: '✉️ Invites', exact: true },
  { path: '/admin/profile', label: '⚙️ My Profile', exact: true },
];

export default function AdminPanel(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Step 1: Fast check from localStorage so the panel doesn't flash a redirect
    // on every load while the API call is in-flight.
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.trust_level === 'admin') {
          setAuthorized(true);
          // Still refresh from server in the background to keep data current
          api.get('/auth/profile').then(res => {
            const fresh = res.data?.user ?? res.data;
            if (fresh?.trust_level !== 'admin') {
              setAuthorized(false);
              navigate('/dashboard');
            } else {
              // Update localStorage with fresh data
              localStorage.setItem('user', JSON.stringify(fresh));
            }
          }).catch(() => {
            // Network / timeout — keep the localStorage-based grant
          });
          return;
        }
      } catch (_) { /* ignore malformed JSON */ }
    }

    // Step 2: No local state — must verify with server
    api.get('/auth/profile').then(res => {
      const u = res.data?.user ?? res.data;
      if (u?.trust_level === 'admin') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/dashboard');
      }
    }).catch((err) => {
      // Only hard-redirect on definitive 401; keep trying on network errors
      if (err?.response?.status === 401) {
        setAuthorized(false);
        navigate('/login');
      } else {
        // Server temporarily unreachable — deny access to be safe
        setAuthorized(false);
        navigate('/login');
      }
    });
  }, []);

  if (authorized === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  // Use exact match for all nav items to avoid /admin matching /admin/profile etc.
  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path + '/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, backgroundColor: '#15803d', color: 'white',
        padding: '24px 0', flexShrink: 0, position: 'relative',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Foodlobby</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>Admin Panel</p>
        </div>
        <nav style={{ marginTop: 16 }}>
          {NAV.map(({ path, label, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'block', padding: '10px 20px', fontSize: 14,
                  color: active ? 'white' : 'rgba(255,255,255,0.75)',
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  textDecoration: 'none', fontWeight: active ? 600 : 400,
                  borderLeft: active ? '3px solid white' : '3px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ position: 'absolute', bottom: 20, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/app" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to App
          </a>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.85)', borderRadius: 6, padding: '6px 14px',
              fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="waitlist" element={<AdminWaitlist />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="invites" element={<AdminInvites />} />
          <Route path="profile" element={<AdminProfile />} />
        </Routes>
      </div>
    </div>
  );
}
