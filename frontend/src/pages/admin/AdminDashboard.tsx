import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Stats {
  active_users: number;
  pending_review: number;
  waitlist: number;
  active_invites: number;
}

export default function AdminDashboard(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = () => {
    setError('');
    api.get('/admin/stats')
      .then(r => {
        setStats(r.data);
        setLastUpdated(new Date());
      })
      .catch(err => {
        setError(
          err?.response?.data?.error ||
          (err?.response?.status ? `Server error ${err.response.status}` : 'Could not reach server')
        );
      });
  };

  useEffect(() => { loadStats(); }, []);

  const tiles = stats ? [
    { label: 'Active Users', value: stats.active_users, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Review', value: stats.pending_review, color: '#d97706', bg: '#fffbeb' },
    { label: 'Waitlist', value: stats.waitlist, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active Invites', value: stats.active_invites, color: '#7c3aed', bg: '#f5f3ff' },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </span>
          )}
          <button
            onClick={loadStats}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#374151',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div style={{
          padding: '14px 18px', borderRadius: 8, backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16,
        }}>
          Failed to load stats: {error}
          <button
            onClick={loadStats}
            style={{
              marginLeft: 12, padding: '3px 10px', borderRadius: 5,
              border: '1px solid #dc2626', backgroundColor: 'white',
              color: '#dc2626', cursor: 'pointer', fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      ) : !stats ? (
        <p style={{ color: '#9ca3af' }}>Loading stats...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {tiles.map(({ label, value, color, bg }) => (
              <div key={label} style={{ backgroundColor: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '20px 24px' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{label}</p>
                <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '18px 22px',
          }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.pending_review > 0 && (
                <a
                  href="/admin/pending"
                  style={{
                    padding: '8px 16px', borderRadius: 6, backgroundColor: '#d97706',
                    color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  }}
                >
                  Review {stats.pending_review} Pending
                </a>
              )}
              {stats.waitlist > 0 && (
                <a
                  href="/admin/waitlist"
                  style={{
                    padding: '8px 16px', borderRadius: 6, backgroundColor: '#2563eb',
                    color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  }}
                >
                  View {stats.waitlist} Waitlist
                </a>
              )}
              <a
                href="/admin/invites"
                style={{
                  padding: '8px 16px', borderRadius: 6, backgroundColor: '#15803d',
                  color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}
              >
                + Generate Invite
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
