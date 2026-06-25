import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F7F6F2',
  surface: '#FFFFFF',
  border:  '#E8E6E0',
  text:    '#1A1917',
  muted:   '#6B6966',
  faint:   '#B5B3AE',
  green:   '#15803d',
  red:     '#DC2626',
  blue:    '#2563EB',
  amber:   '#D97706',
  font:    `'Inter', 'DM Sans', system-ui, -apple-system, sans-serif`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

const WAITLIST_COLORS: Record<string, string> = {
  waiting:    '#F59E0B',
  invited:    '#3B82F6',
  declined:   '#EF4444',
  registered: '#10B981',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      backgroundColor: color + '18', color,
      fontFamily: T.font, letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 10, color: 'white', fontWeight: 500,
      backgroundColor: ok ? '#16A34A' : '#DC2626',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      fontSize: 13, fontFamily: T.font,
    }}>
      {msg}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminQueue(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const [pendingUsers,  setPendingUsers]  = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingCount,  setPendingCount]  = useState(0);

  const [entries,        setEntries]       = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState('waiting');
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [actionLoading,  setActionLoading] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Pending ───────────────────────────────────────────────────────────────

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.get('/admin/pending');
      const users = res.data.users || [];
      setPendingUsers(users);
      setPendingCount(users.length);
    } catch { showToast('Failed to load pending applications', false); }
    finally { setPendingLoading(false); }
  }, []);

  const approvePending = async (id: number) => {
    setActionLoading(id);
    try { await api.post(`/admin/approve/${id}`); showToast('User approved and notified.'); loadPending(); }
    catch { showToast('Failed to approve user', false); }
    finally { setActionLoading(null); }
  };

  const declinePending = async (id: number) => {
    const reason = window.prompt('Reason for declining (optional):');
    setActionLoading(id);
    try { await api.post(`/admin/decline/${id}`, { reason }); showToast('User declined and notified.'); loadPending(); }
    catch { showToast('Failed to decline user', false); }
    finally { setActionLoading(null); }
  };

  // ── Waitlist ──────────────────────────────────────────────────────────────

  const loadWaitlist = useCallback(async () => {
    setWaitlistLoading(true);
    try {
      const [current, ...counts] = await Promise.all([
        api.get(`/admin/waitlist?status=${waitlistStatus}`),
        ...WAITLIST_STATUSES.map(s => api.get(`/admin/waitlist?status=${s}`)),
      ]);
      setEntries(current.data.entries || []);
      const nc: Record<string, number> = {};
      WAITLIST_STATUSES.forEach((s, i) => { nc[s] = (counts[i].data.entries || []).length; });
      setWaitlistCounts(nc);
    } catch { showToast('Failed to load waitlist', false); }
    finally { setWaitlistLoading(false); }
  }, [waitlistStatus]);

  const sendInvite = async (id: number) => {
    setActionLoading(id);
    try { await api.post(`/admin/waitlist/${id}/invite`); showToast('Invite sent successfully'); loadWaitlist(); }
    catch (err: any) { showToast(err?.response?.data?.error || 'Failed to send invite', false); }
    finally { setActionLoading(null); }
  };

  const declineWaitlist = async (id: number) => {
    if (!window.confirm('Decline this waitlist entry?')) return;
    setActionLoading(id);
    try { await api.post(`/admin/waitlist/${id}/decline`); showToast('Entry declined'); loadWaitlist(); }
    catch { showToast('Failed to decline', false); }
    finally { setActionLoading(null); }
  };

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { if (activeTab === 'waitlist') loadWaitlist(); }, [activeTab, loadWaitlist]);

  // ── Shared styles ─────────────────────────────────────────────────────────

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, color: T.muted, whiteSpace: 'nowrap',
    backgroundColor: '#FAFAF8', textTransform: 'uppercase',
    letterSpacing: '0.06em', fontFamily: T.font,
  };
  const td: React.CSSProperties = {
    padding: '13px 16px', fontSize: 13, color: T.text,
    borderBottom: `1px solid ${T.border}`, verticalAlign: 'top',
    fontFamily: T.font,
  };

  const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 7, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: T.green, color: 'white', fontWeight: 600, fontSize: 12,
    opacity: disabled ? 0.55 : 1, fontFamily: T.font,
  });
  const btnGhost = (disabled?: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 7, border: `1px solid #FECACA`,
    backgroundColor: 'white', color: T.red, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500, fontSize: 12, opacity: disabled ? 0.55 : 1, fontFamily: T.font,
  });

  return (
    <div style={{ fontFamily: T.font }}>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Queue</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>
          Review pending applications and manage the waitlist in one place.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 26, gap: 0 }}>
        {([
          { key: 'pending',   label: 'Pending Review', count: pendingCount },
          { key: 'waitlist',  label: 'Waitlist',        count: waitlistCounts['waiting'] ?? null },
        ] as { key: ActiveTab; label: string; count: number | null }[]).map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: active ? 600 : 400,
                border: 'none', borderBottom: active ? '2px solid #15803d' : '2px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer',
                color: active ? T.green : T.muted, marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 7, fontFamily: T.font,
              }}
            >
              {label}
              {count !== null && count > 0 && (
                <span style={{
                  backgroundColor: active ? T.green : '#F0EDE8',
                  color: active ? 'white' : T.muted,
                  borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Pending Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={loadPending} style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: 'pointer', fontSize: 12, color: T.muted, fontFamily: T.font }}>
              ↻ Refresh
            </button>
          </div>

          {pendingLoading ? (
            <p style={{ color: T.faint, fontSize: 14, textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : pendingUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, color: T.faint, fontSize: 14 }}>
              No pending applications.
            </div>
          ) : (
            <div style={{ backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'GSTN', 'Phone', 'Invited By', 'Registered', 'Actions'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                      <td style={td}>{u.email}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{u.gstn || <span style={{ color: T.faint }}>—</span>}</td>
                      <td style={td}>{u.phone_number || <span style={{ color: T.faint }}>—</span>}</td>
                      <td style={td}>
                        {u.invited_by_username
                          ? <span>{u.invited_by_username}</span>
                          : <span style={{ color: T.faint }}>Marketing</span>}
                      </td>
                      <td style={{ ...td, fontSize: 12, color: T.faint, whiteSpace: 'nowrap' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => approvePending(u.id)} disabled={actionLoading === u.id} style={btnPrimary(actionLoading === u.id)}>Approve</button>
                          <button onClick={() => declinePending(u.id)} disabled={actionLoading === u.id} style={btnGhost(actionLoading === u.id)}>Decline</button>
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

      {/* ── Waitlist Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'waitlist' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
            {WAITLIST_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setWaitlistStatus(s)}
                style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `1px solid ${waitlistStatus === s ? T.green : T.border}`,
                  cursor: 'pointer', fontSize: 12, fontWeight: waitlistStatus === s ? 600 : 400,
                  backgroundColor: waitlistStatus === s ? T.green : T.surface,
                  color: waitlistStatus === s ? 'white' : T.muted,
                  fontFamily: T.font,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {waitlistCounts[s] !== undefined && (
                  <span style={{ marginLeft: 5, opacity: 0.75 }}>({waitlistCounts[s]})</span>
                )}
              </button>
            ))}
            <button onClick={loadWaitlist} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: 'pointer', fontSize: 12, color: T.muted, fontFamily: T.font }}>
              ↻
            </button>
          </div>

          {waitlistLoading ? (
            <p style={{ color: T.faint, fontSize: 14, textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, color: T.faint, fontSize: 14 }}>
              No {waitlistStatus} entries.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map(e => (
                <div key={e.id} style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{e.first_name} {e.last_name}</span>
                        <Badge label={e.status} color={WAITLIST_COLORS[e.status] || '#6B7280'} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '3px 20px' }}>
                        <span style={{ fontSize: 13, color: T.muted }}>{e.email}</span>
                        <span style={{ fontSize: 13, color: T.muted }}>{e.mobile_number || '—'}</span>
                        {e.gstn && <span style={{ fontSize: 13, color: T.muted, fontFamily: 'monospace' }}>GSTN: {e.gstn}</span>}
                        <span style={{ fontSize: 12, color: T.faint }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {e.business_description && (
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.5 }}>"{e.business_description}"</p>
                      )}
                    </div>

                    {e.status === 'waiting' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => sendInvite(e.id)} disabled={actionLoading === e.id} style={btnPrimary(actionLoading === e.id)}>
                          {actionLoading === e.id ? 'Sending…' : 'Send Invite'}
                        </button>
                        <button onClick={() => declineWaitlist(e.id)} disabled={actionLoading === e.id} style={btnGhost(actionLoading === e.id)}>
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
