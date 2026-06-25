import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import AdminQueue from './AdminQueue';
import AdminUsers from './AdminUsers';
import AdminInvites from './AdminInvites';
import AdminProfile from './AdminProfile';
import AdminModerationPage from './AdminModerationPage';

// Moderation is intentionally excluded from the admin sidebar —
// it belongs to the moderator workflow. Route is kept alive for admin
// access if ever needed via direct URL.

const NAV = [
  { path: '/admin',         label: 'Dashboard', exact: true },
  { path: '/admin/queue',   label: 'Queue',     exact: true },
  { path: '/admin/users',   label: 'Users',     exact: true },
  { path: '/admin/invites', label: 'Invites',   exact: true },
  { path: '/admin/profile', label: 'Profile',   exact: true },
];

const font = `'Inter', 'DM Sans', system-ui, -apple-system, sans-serif`;

export default function AdminPanel(): JSX.Element {
  const location  = useLocation();
  const navigate  = useNavigate();
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
            if (fresh?.trust_level !== 'admin') { setAuthorized(false); navigate('/dashboard'); }
            else localStorage.setItem('user', JSON.stringify(fresh));
          }).catch(() => {});
          return;
        }
      } catch (_) {}
    }
    api.get('/auth/profile').then(res => {
      const u = res.data?.user ?? res.data;
      if (u?.trust_level === 'admin') setAuthorized(true);
      else { setAuthorized(false); navigate('/dashboard'); }
    }).catch(() => { setAuthorized(false); navigate('/login'); });
  }, []);

  if (authorized === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontFamily: font, fontSize: 14 }}>
        Verifying access…
      </div>
    );
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path + '/');

  return (
    <div className="admin-root" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F6F2', fontFamily: font }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 210,
        background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Brand mark */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1 }}>FL</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Foodlobby</p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 16px 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px' }}>
          {NAV.map(({ path, label, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '9px 12px',
                  marginBottom: 2,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'white' : 'rgba(255,255,255,0.58)',
                  backgroundColor: active ? 'rgba(255,255,255,0.13)' : 'transparent',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.58)'; } }}
              >
                {/* Active pill */}
                <span style={{
                  display: 'inline-block',
                  width: 3, height: active ? 16 : 0,
                  borderRadius: 2,
                  backgroundColor: 'white',
                  marginRight: active ? 10 : 0,
                  transition: 'height 0.2s, margin 0.2s',
                  flexShrink: 0,
                }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 16px 12px' }} />

        {/* Bottom */}
        <div style={{ padding: '0 10px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a
            href="/app"
            style={{
              display: 'block', padding: '8px 12px', borderRadius: 8,
              fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
            }}
          >
            ← Back to App
          </a>
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
            style={{
              display: 'block', width: '100%', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 13,
              textAlign: 'left', fontFamily: font,
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route index               element={<AdminDashboard />} />
          <Route path="queue"        element={<AdminQueue />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="invites"      element={<AdminInvites />} />
          <Route path="profile"      element={<AdminProfile />} />
          <Route path="moderation"   element={<AdminModerationPage />} />
        </Routes>
      </main>
    </div>
  );
}
