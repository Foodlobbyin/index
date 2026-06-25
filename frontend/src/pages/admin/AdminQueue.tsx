import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gstn: string;
  phone_number: string;
  invited_by_username: string | null;
  created_at: string;
}

interface WaitlistEntry {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  gstn: string;
  business_description: string;
  status: string;
  created_at: string;
}

type ActiveTab = 'pending' | 'waitlist';

const WAITLIST_STATUSES = ['waiting', 'invited', 'declined'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const badge = (label: string, color: string) => (
  <span style={{
    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
    backgroundColor: color + '20', color,
  }}>
    {label}
  </span>
);

const WAITLIST_COLORS: Record<string, string> = {
  waiting: '#f59e0b',
  invited: '#3b82f6',
  declined: '#ef4444',
  registered: '#10b981',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminQueue(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Pending state
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Waitlist state
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState('waiting');
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Pending loaders ───────────────────────────────────────────────────────

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.get('/admin/pending');
      const users = res.data.users || [];
      setPendingUsers(users);
      setPendingCount(users.length);
    } catch {
      showToast('Failed to load pending applications', false);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const approvePending = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/approve/${id}`);
      showToast('User approved and notified.');
      loadPending();
    } catch {
      showToast('Failed to approve user', false);
    } finally {
      setActionLoading(null);
    }
  };

  const declinePending = async (id: number) => {
    const reason = window.prompt('Reason for declining (optional):');
    setActionLoading(id);
    try {
      await api.post(`/admin/decline/${id}`, { reason });
      showToast('User declined and notified.');
      loadPending();
    } catch {
      showToast('Failed to decline user', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Waitlist loaders ──────────────────────────────────────────────────────

  const loadWaitlist = useCallback(async () => {
    setWaitlistLoading(true);
    try {
      // Load selected status + counts for all statuses in parallel
      const [current, ...counts] = await Promise.all([
        api.get(`/admin/waitlist?status=${waitlistStatus}`),
        ...WAITLIST_STATUSES.map(s => api.get(`/admin/waitlist?status=${s}`)),
      ]);
      setEntries(current.data.entries || []);
      const newCounts: Record<string, number> = {};
      WAITLIST_STATUSES.forEach((s, i) => {
        newCounts[s] = (counts[i].data.entries || []).length;
      });
      setWaitlistCounts(newCounts);
    } catch {
      showToast('Failed to load waitlist', false);
    } finally {
      setWaitlistLoading(false);
    }
  }, [waitlistStatus]);

  const sendInvite = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/waitlist/${id}/invite`);
      showToast('Invite sent successfully');
      loadWaitlist();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to send invite', false);
    } finally {
      setActionLoading(null);
    }
  };

  const declineWaitlist = async (id: number) => {
    if (!window.confirm('Decline this waitlist entry?')) return;
    setActionLoading(id);
    try {
      await api.post(`/admin/waitlist/${id}/decline`);
      showToast('Entry declined');
      loadWaitlist();
    } catch {
      showToast('Failed to decline', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (activeTab === 'waitlist') loadWaitlist();
  }, [activeTab, loadWaitlist]);

  // ── Styles ────────────────────────────────────────────────────────────────

  const th: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'left', fontSize: 12,
    color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap', backgroundColor: '#f9fafb',
  };
  const td: React.CSSProperties = {
    padding: '11px 14px', fontSize: 13, color: '#374151',
    borderBottom: '1px solid #f3f4f6', verticalAlign: 'top',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toast */}
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

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Queue</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Review pending applications and manage the waitlist in one place.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24, gap: 0,
      }}>
        {([
          { key: 'pending', label: 'Pending Review', count: pendingCount },
          { key: 'waitlist', label: 'Waitlist', count: waitlistCounts['waiting'] ?? null },
        ] as { key: ActiveTab; label: string; count: number | null }[]).map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400,
                border: 'none', borderBottom: active ? '2px solid #15803d' : '2px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer',
                color: active ? '#15803d' : '#6b7280',
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              {label}
              {count !== null && count > 0 && (
                <span style={{
                  backgroundColor: active ? '#15803d' : '#e5e7eb',
                  color: active ? 'white' : '#6b7280',
                  borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Pending Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={loadPending}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#374151',
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {pendingLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
          ) : pendingUsers.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60, backgroundColor: 'white',
              borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
            }}>
              No pending applications.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>GSTN</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Invited By</th>
                    <th style={th}>Registered</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ ...td, fontWeight: 600, color: '#111827' }}>
                        {u.first_name} {u.last_name}
                      </td>
                      <td style={td}>{u.email}</td>
                      <td style={td}>
                        <code style={{ fontSize: 12, color: '#374151' }}>{u.gstn || '—'}</code>
                      </td>
                      <td style={td}>{u.phone_number || '—'}</td>
                      <td style={td}>
                        {u.invited_by_username
                          ? <span style={{ color: '#374151' }}>{u.invited_by_username}</span>
                          : <span style={{ color: '#9ca3af' }}>Marketing</span>}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: '#9ca3af', fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => approvePending(u.id)}
                            disabled={actionLoading === u.id}
                            style={{
                              padding: '5px 14px', backgroundColor: '#16a34a', color: 'white',
                              border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                              opacity: actionLoading === u.id ? 0.6 : 1,
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => declinePending(u.id)}
                            disabled={actionLoading === u.id}
                            style={{
                              padding: '5px 14px', backgroundColor: 'white', color: '#dc2626',
                              border: '1px solid #fca5a5', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                              opacity: actionLoading === u.id ? 0.6 : 1,
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Waitlist Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'waitlist' && (
        <>
          {/* Status sub-tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
            {WAITLIST_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setWaitlistStatus(s)}
                style={{
                  padding: '5px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  backgroundColor: waitlistStatus === s ? '#15803d' : '#f3f4f6',
                  color: waitlistStatus === s ? 'white' : '#374151',
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {waitlistCounts[s] !== undefined && (
                  <span style={{ marginLeft: 5, opacity: 0.8 }}>({waitlistCounts[s]})</span>
                )}
              </button>
            ))}
            <button
              onClick={loadWaitlist}
              style={{
                marginLeft: 'auto', padding: '5px 14px', borderRadius: 6,
                border: '1px solid #d1d5db', backgroundColor: 'white',
                cursor: 'pointer', fontSize: 13, color: '#374151',
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {waitlistLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60, backgroundColor: 'white',
              borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
            }}>
              No {waitlistStatus} entries.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map(e => (
                <div key={e.id} style={{
                  backgroundColor: 'white', border: '1px solid #e5e7eb',
                  borderRadius: 10, padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                          {e.first_name} {e.last_name}
                        </span>
                        {badge(e.status, WAITLIST_COLORS[e.status] || '#6b7280')}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '3px 20px' }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{e.email}</span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{e.mobile_number || '—'}</span>
                        {e.gstn && <span style={{ fontSize: 13, color: '#6b7280' }}>GSTN: {e.gstn}</span>}
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                          {new Date(e.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      {e.business_description && (
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                          "{e.business_description}"
                        </p>
                      )}
                    </div>

                    {e.status === 'waiting' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => sendInvite(e.id)}
                          disabled={actionLoading === e.id}
                          style={{
                            padding: '7px 16px', borderRadius: 6, border: 'none',
                            backgroundColor: '#15803d', color: 'white', fontWeight: 600,
                            fontSize: 13, cursor: 'pointer',
                            opacity: actionLoading === e.id ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === e.id ? 'Sending...' : 'Send Invite'}
                        </button>
                        <button
                          onClick={() => declineWaitlist(e.id)}
                          disabled={actionLoading === e.id}
                          style={{
                            padding: '7px 16px', borderRadius: 6, border: '1px solid #fca5a5',
                            backgroundColor: 'white', color: '#dc2626', fontWeight: 500,
                            fontSize: 13, cursor: 'pointer',
                            opacity: actionLoading === e.id ? 0.6 : 1,
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
