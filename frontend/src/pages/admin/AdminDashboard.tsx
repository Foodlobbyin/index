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

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  const tiles = stats ? [
    { label: 'Active Users', value: stats.active_users, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Review', value: stats.pending_review, color: '#d97706', bg: '#fffbeb' },
    { label: 'Waitlist', value: stats.waitlist, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active Invites', value: stats.active_invites, color: '#7c3aed', bg: '#f5f3ff' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Dashboard</h1>
      {!stats
        ? <p style={{ color: '#9ca3af' }}>Loading stats...</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {tiles.map(({ label, value, color, bg }) => (
              <div key={label} style={{ backgroundColor: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '20px 24px' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{label}</p>
                <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
