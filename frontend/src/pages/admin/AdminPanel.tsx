import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import AdminPending from './AdminPending';
import AdminWaitlist from './AdminWaitlist';
import AdminUsers from './AdminUsers';
import AdminInvites from './AdminInvites';

const NAV = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/pending', label: '⏳ Pending Review' },
  { path: '/admin/waitlist', label: '📋 Waitlist' },
  { path: '/admin/users', label: '👥 Users' },
  { path: '/admin/invites', label: '✉️ Invites' },
];

export default function AdminPanel(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      if (res.data.user?.trust_level === 'admin') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/dashboard');
      }
    }).catch(() => {
      setAuthorized(false);
      navigate('/login');
    });
  }, []);

  if (authorized === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, backgroundColor: '#15803d', color: 'white',
        padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Foodlobby</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>Admin Panel</p>
        </div>
        <nav style={{ marginTop: 16 }}>
          {NAV.map(({ path, label, exact }) => (
            <Link
              key={path}
              to={path}
              style={{
                display: 'block', padding: '10px 20px', fontSize: 14,
                color: isActive(path, exact) ? 'white' : 'rgba(255,255,255,0.75)',
                backgroundColor: isActive(path, exact) ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none', fontWeight: isActive(path, exact) ? 600 : 400,
                borderLeft: isActive(path, exact) ? '3px solid white' : '3px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 20, padding: '0 20px' }}>
          <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to App
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="waitlist" element={<AdminWaitlist />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="invites" element={<AdminInvites />} />
        </Routes>
      </div>
    </div>
  );
}
