import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminPending(): JSX.Element {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/pending').then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    await api.post(`/admin/approve/${id}`);
    setActionMsg('User approved and notified.');
    load();
  };

  const decline = async (id: number) => {
    const reason = window.prompt('Reason for declining (optional):');
    await api.post(`/admin/decline/${id}`, { reason });
    setActionMsg('User declined and notified.');
    load();
  };

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Pending Review</h1>
      {actionMsg && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#15803d', fontSize: 13 }}>{actionMsg}</div>}
      {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> : users.length === 0
        ? <p style={{ color: '#9ca3af' }}>No pending applications.</p>
        : (
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={th}>Name</th><th style={th}>Email</th><th style={th}>GSTN</th>
                  <th style={th}>Phone</th><th style={th}>Invited By</th><th style={th}>Registered</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={td}>{u.first_name} {u.last_name}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}><code style={{ fontSize: 12 }}>{u.gstn || '—'}</code></td>
                    <td style={td}>{u.phone_number || '—'}</td>
                    <td style={td}>{u.invited_by_username || <span style={{ color: '#9ca3af' }}>Marketing</span>}</td>
                    <td style={td}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={td}>
                      <button onClick={() => approve(u.id)} style={{ padding: '6px 14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', marginRight: 6 }}>Approve</button>
                      <button onClick={() => decline(u.id)} style={{ padding: '6px 14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Decline</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}
