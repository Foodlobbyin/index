import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  gstn: string;
  trust_level: string;
  registration_status: string;
  account_activated: boolean;
  email_verified: boolean;
  can_send_invites: boolean;
  created_at: string;
}

const TRUST_LEVELS = ['basic', 'verified', 'trusted', 'moderator', 'admin'];

export default function AdminUsers(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch {
      showToast('Failed to load users', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleInvites = async (user: User) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/toggle-invites`, { enabled: !user.can_send_invites });
      showToast(`Invite privilege ${!user.can_send_invites ? 'enabled' : 'disabled'} for ${user.username}`);
      load();
    } catch {
      showToast('Failed to update invite privilege', false);
    } finally {
      setActionLoading(null);
    }
  };

  const changeTrustLevel = async (user: User, trust_level: string) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/trust-level`, { trust_level });
      showToast(`Trust level updated to ${trust_level}`);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update trust level', false);
    } finally {
      setActionLoading(null);
    }
  };

  const trustBadgeColor: Record<string, string> = {
    basic: '#6b7280',
    verified: '#3b82f6',
    trusted: '#8b5cf6',
    moderator: '#f59e0b',
    admin: '#ef4444',
  };

  const statusBadgeColor: Record<string, string> = {
    active: '#10b981',
    pending_review: '#f59e0b',
    declined: '#ef4444',
    suspended: '#6b7280',
  };

  const filtered = users.filter(u =>
    !search || [u.username, u.email, u.first_name, u.last_name, u.gstn]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, color: 'white',
          backgroundColor: toast.ok ? '#16a34a' : '#dc2626', fontWeight: 500,
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Users</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Manage all registered members.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name, email, username, GSTN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 14px', borderRadius: 8,
            border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={load}
          style={{
            padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
            backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#374151',
          }}
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: 'white',
          borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
        }}>
          No users found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['User', 'GSTN', 'Status', 'Trust Level', 'Invites', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                    {(u.first_name || u.last_name) && (
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{u.first_name} {u.last_name}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>
                    {u.gstn || <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      backgroundColor: (statusBadgeColor[u.registration_status] || '#6b7280') + '20',
                      color: statusBadgeColor[u.registration_status] || '#6b7280',
                    }}>
                      {u.registration_status?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <select
                      value={u.trust_level}
                      disabled={actionLoading === u.id}
                      onChange={e => changeTrustLevel(u, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 6,
                        border: `1px solid ${trustBadgeColor[u.trust_level] || '#d1d5db'}`,
                        fontSize: 12, color: trustBadgeColor[u.trust_level] || '#374151',
                        backgroundColor: (trustBadgeColor[u.trust_level] || '#6b7280') + '15',
                        cursor: 'pointer',
                      }}
                    >
                      {TRUST_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <div
                        onClick={() => actionLoading !== u.id && toggleInvites(u)}
                        style={{
                          width: 36, height: 20, borderRadius: 10, position: 'relative',
                          backgroundColor: u.can_send_invites ? '#15803d' : '#d1d5db',
                          cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2,
                          left: u.can_send_invites ? 18 : 2,
                          width: 16, height: 16, borderRadius: '50%',
                          backgroundColor: 'white', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: u.can_send_invites ? '#15803d' : '#9ca3af' }}>
                        {u.can_send_invites ? 'On' : 'Off'}
                      </span>
                    </label>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!u.email_verified && (
                        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>Unverified email</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: '#9ca3af' }}>
        Showing {filtered.length} of {users.length} users
      </div>
    </div>
  );
}
