import { useState, useEffect, useCallback } from 'react';
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
  font:    `'Inter', 'DM Sans', system-ui, -apple-system, sans-serif`,
};

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
const PAGE_SIZE    = 25;

const STATUS_FILTERS = [
  { key: 'all',            label: 'All' },
  { key: 'active',         label: 'Active' },
  { key: 'pending_review', label: 'Pending' },
  { key: 'declined',       label: 'Declined' },
  { key: 'suspended',      label: 'Suspended' },
];

const TRUST_COLORS: Record<string, string> = {
  basic:     '#9CA3AF',
  verified:  '#3B82F6',
  trusted:   '#8B5CF6',
  moderator: '#F59E0B',
  admin:     '#EF4444',
};

const STATUS_COLORS: Record<string, string> = {
  active:         '#10B981',
  pending_review: '#F59E0B',
  declined:       '#EF4444',
  suspended:      '#9CA3AF',
};

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const field = (label: string, value: string | boolean) => (
    <div key={label}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: T.font }}>{label}</p>
      <p style={{ margin: '3px 0 0', fontSize: 13, color: T.text, wordBreak: 'break-all', fontFamily: T.font }}>{String(value)}</p>
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: T.surface, borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', border: `1px solid ${T.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: T.font }}>
              {user.first_name} {user.last_name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted, fontFamily: T.font }}>@{user.username}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: T.faint, padding: 0, lineHeight: 1, fontFamily: T.font }}>×</button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: user.registration_status?.replace('_', ' '), color: STATUS_COLORS[user.registration_status] || '#9CA3AF' },
            { label: user.trust_level, color: TRUST_COLORS[user.trust_level] || '#9CA3AF' },
            ...(!user.email_verified ? [{ label: 'email unverified', color: '#F59E0B' }] : []),
          ].map(({ label, color }) => (
            <span key={label} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: color + '18', color, fontFamily: T.font }}>
              {label}
            </span>
          ))}
        </div>

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 22, padding: '18px', backgroundColor: T.bg, borderRadius: 10 }}>
          {field('Email', user.email)}
          {field('GSTN', user.gstn || '—')}
          {field('Account Activated', user.account_activated ? 'Yes' : 'No')}
          {field('Can Send Invites', user.can_send_invites ? 'Yes' : 'No')}
          {field('Joined', new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: 'pointer', fontSize: 13, color: T.muted, fontFamily: T.font }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      style={{
        width: 34, height: 18, borderRadius: 9, position: 'relative',
        backgroundColor: on ? T.green : '#D1D5DB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 14, height: 14, borderRadius: '50%',
        backgroundColor: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminUsers(): JSX.Element {
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trustFilter,  setTrustFilter]  = useState('all');
  const [page,         setPage]         = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch { showToast('Failed to load users', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, trustFilter]);

  const toggleInvites = async (user: User) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/toggle-invites`, { enabled: !user.can_send_invites });
      showToast(`Invite privilege ${!user.can_send_invites ? 'enabled' : 'disabled'} for ${user.username}`);
      load();
    } catch { showToast('Failed to update invite privilege', false); }
    finally { setActionLoading(null); }
  };

  const changeTrustLevel = async (user: User, trust_level: string) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/trust-level`, { trust_level });
      showToast(`Trust level updated to ${trust_level}`);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update trust level', false);
    } finally { setActionLoading(null); }
  };

  // ── Filtering + pagination ────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      [u.username, u.email, u.first_name, u.last_name, u.gstn]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || u.registration_status === statusFilter;
    const matchTrust  = trustFilter  === 'all' || u.trust_level === trustFilter;
    return matchSearch && matchStatus && matchTrust;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts: Record<string, number> = {};
  users.forEach(u => { statusCounts[u.registration_status] = (statusCounts[u.registration_status] || 0) + 1; });

  // ── Styles ────────────────────────────────────────────────────────────────

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: T.muted, whiteSpace: 'nowrap', backgroundColor: '#FAFAF8',
    textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: T.font,
  };
  const td: React.CSSProperties = {
    padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontFamily: T.font,
  };

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 10, color: 'white', fontWeight: 500, backgroundColor: toast.ok ? '#16A34A' : '#DC2626', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 13, fontFamily: T.font }}>
          {toast.msg}
        </div>
      )}

      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Users</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>
          {users.length} registered member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(({ key, label }) => {
          const count  = key === 'all' ? users.length : (statusCounts[key] || 0);
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '5px 14px', borderRadius: 20,
                border: `1px solid ${active ? T.green : T.border}`,
                cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                backgroundColor: active ? T.green : T.surface,
                color: active ? 'white' : T.muted,
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.font,
              }}
            >
              {label}
              {count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#F0EDE8', color: active ? 'white' : T.muted, borderRadius: 8, padding: '0 6px' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + trust filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search name, email, username, GSTN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: 'none', fontFamily: T.font, backgroundColor: T.surface, color: T.text }}
        />
        <select
          value={trustFilter}
          onChange={e => setTrustFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, backgroundColor: T.surface, color: T.text }}
        >
          <option value="all">All Trust Levels</option>
          {TRUST_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: 'pointer', fontSize: 13, color: T.muted, fontFamily: T.font }}>↻</button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: T.faint, fontSize: 14, textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, color: T.faint, fontSize: 14 }}>
          No users match the current filters.
        </div>
      ) : (
        <div style={{ backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User', 'GSTN', 'Status', 'Trust Level', 'Invites', 'Joined'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAF8')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: T.faint, marginTop: 1 }}>{u.email}</div>
                    {(u.first_name || u.last_name) && (
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{u.first_name} {u.last_name}</div>
                    )}
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: T.muted }}>
                    {u.gstn || <span style={{ color: T.faint }}>—</span>}
                  </td>
                  <td style={td}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: (STATUS_COLORS[u.registration_status] || '#9CA3AF') + '18', color: STATUS_COLORS[u.registration_status] || '#9CA3AF', fontFamily: T.font }}>
                      {u.registration_status?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    <select
                      value={u.trust_level}
                      disabled={actionLoading === u.id}
                      onChange={e => changeTrustLevel(u, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${TRUST_COLORS[u.trust_level] || T.border}`, fontSize: 12, color: TRUST_COLORS[u.trust_level] || T.text, backgroundColor: (TRUST_COLORS[u.trust_level] || '#9CA3AF') + '12', cursor: 'pointer', fontFamily: T.font }}
                    >
                      {TRUST_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    <Toggle on={u.can_send_invites} onClick={() => toggleInvites(u)} disabled={actionLoading === u.id} />
                  </td>
                  <td style={{ ...td, fontSize: 12, color: T.faint, whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, color: T.faint, fontFamily: T.font }}>
          {filtered.length === 0 ? 'No results' : `${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: page === 1 ? T.faint : T.muted, fontFamily: T.font }}>
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : (page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i));
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${p === page ? T.green : T.border}`, backgroundColor: p === page ? T.green : T.surface, color: p === page ? 'white' : T.muted, cursor: 'pointer', fontSize: 12, fontWeight: p === page ? 600 : 400, minWidth: 32, fontFamily: T.font }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surface, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, color: page === totalPages ? T.faint : T.muted, fontFamily: T.font }}>
              ›
            </button>
          </div>
        )}
      </div>
      <p style={{ marginTop: 8, fontSize: 11, color: T.faint, fontFamily: T.font }}>Click any row to view full user details.</p>
    </div>
  );
}
