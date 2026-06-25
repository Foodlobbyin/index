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
  moderation_note?: string;
  moderated_at?: string;
}

const TRUST_LEVELS = ['basic', 'verified', 'trusted', 'moderator', 'admin'];
const PAGE_SIZE = 25;

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending_review', label: 'Pending' },
  { key: 'declined', label: 'Declined' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'banned', label: 'Banned' },
];

const TRUST_COLORS: Record<string, string> = {
  basic: '#6b7280', verified: '#3b82f6', trusted: '#8b5cf6',
  moderator: '#f59e0b', admin: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  pending_review: '#f59e0b',
  declined: '#ef4444',
  suspended: '#f97316',
  banned: '#7f1d1d',
};

// ── Moderation Action Modal ───────────────────────────────────────────────────

interface ModerationModalProps {
  user: User;
  action: 'suspend' | 'ban' | 'delete' | 'unsuspend';
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function ModerationModal({ user, action, onConfirm, onClose }: ModerationModalProps) {
  const [reason, setReason] = useState('');

  const config = {
    suspend: {
      title: 'Suspend User',
      color: '#f97316',
      bg: '#fff7ed',
      border: '#fed7aa',
      description: `Suspending @${user.username} will block their login immediately. This is reversible — you can restore them later.`,
      requiresReason: true,
      confirmLabel: 'Suspend User',
    },
    ban: {
      title: 'Permanently Ban User',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      description: `Banning @${user.username} permanently blocks their account and revokes invite privileges. Use for confirmed fake identities or repeat offenders.`,
      requiresReason: true,
      confirmLabel: 'Permanently Ban',
    },
    delete: {
      title: 'Delete User Account',
      color: '#991b1b',
      bg: '#fef2f2',
      border: '#fecaca',
      description: `This will permanently delete @${user.username} and all associated data. This action CANNOT be undone. Use only for confirmed fake/fraudulent accounts.`,
      requiresReason: false,
      confirmLabel: 'Permanently Delete',
    },
    unsuspend: {
      title: 'Restore User',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#86efac',
      description: `This will restore @${user.username} to active status and re-enable their login.`,
      requiresReason: false,
      confirmLabel: 'Restore Account',
    },
  }[action];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: 12, padding: 28,
          width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          border: `2px solid ${config.border}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: config.color }}>{config.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ backgroundColor: config.bg, border: `1px solid ${config.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{config.description}</p>
        </div>

        {config.requiresReason && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reason (optional but recommended)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Why are you ${action === 'suspend' ? 'suspending' : 'banning'} this user?`}
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 7,
                border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {action === 'delete' && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
              ⚠ This is irreversible. The audit log will record this action for accountability.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: 7,
              border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
              cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            style={{
              flex: 1, padding: '10px', borderRadius: 7,
              border: 'none', backgroundColor: config.color,
              cursor: 'pointer', fontSize: 13, color: 'white', fontWeight: 700,
            }}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────

function UserModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: 12, padding: 28,
          width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
              {user.first_name} {user.last_name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>@{user.username}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            backgroundColor: (STATUS_COLORS[user.registration_status] || '#6b7280') + '20',
            color: STATUS_COLORS[user.registration_status] || '#6b7280',
          }}>
            {user.registration_status?.replace('_', ' ')}
          </span>
          <span style={{
            padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            backgroundColor: (TRUST_COLORS[user.trust_level] || '#6b7280') + '20',
            color: TRUST_COLORS[user.trust_level] || '#6b7280',
          }}>
            {user.trust_level}
          </span>
          {!user.email_verified && (
            <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e' }}>
              Email unverified
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 20 }}>
          {[
            { label: 'Email', value: user.email },
            { label: 'GSTN', value: user.gstn || '—' },
            { label: 'Account activated', value: user.account_activated ? 'Yes' : 'No' },
            { label: 'Can send invites', value: user.can_send_invites ? 'Yes' : 'No' },
            { label: 'Joined', value: new Date(user.created_at).toLocaleDateString('en-IN') },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#111827', wordBreak: 'break-all' }}>{value}</p>
            </div>
          ))}
        </div>

        {user.moderation_note && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Moderation Note</p>
            <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{user.moderation_note}</p>
            {user.moderated_at && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                {new Date(user.moderated_at).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '9px', borderRadius: 7,
            border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
            cursor: 'pointer', fontSize: 13, color: '#374151',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminUsers(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trustFilter, setTrustFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [moderationModal, setModerationModal] = useState<{
    user: User;
    action: 'suspend' | 'ban' | 'delete' | 'unsuspend';
  } | null>(null);

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
  useEffect(() => { setPage(1); }, [search, statusFilter, trustFilter]);

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

  // ── Moderation actions ────────────────────────────────────────────────────

  const openModerationModal = (user: User, action: 'suspend' | 'ban' | 'delete' | 'unsuspend') => {
    setModerationModal({ user, action });
  };

  const executeModerationAction = async (reason: string) => {
    if (!moderationModal) return;
    const { user, action } = moderationModal;
    setModerationModal(null);
    setActionLoading(user.id);

    try {
      if (action === 'suspend') {
        await api.patch(`/admin/users/${user.id}/suspend`, { reason });
        showToast(`@${user.username} has been suspended`);
      } else if (action === 'ban') {
        await api.patch(`/admin/users/${user.id}/ban`, { reason });
        showToast(`@${user.username} has been permanently banned`, true);
      } else if (action === 'unsuspend') {
        await api.patch(`/admin/users/${user.id}/unsuspend`);
        showToast(`@${user.username} has been restored to active`);
      } else if (action === 'delete') {
        await api.delete(`/admin/users/${user.id}`, { data: { confirm: true } });
        showToast(`@${user.username} has been permanently deleted`);
      }
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || `Failed to ${action} user`, false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtering + Pagination ────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      [u.username, u.email, u.first_name, u.last_name, u.gstn]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || u.registration_status === statusFilter;
    const matchTrust = trustFilter === 'all' || u.trust_level === trustFilter;
    return matchSearch && matchStatus && matchTrust;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts: Record<string, number> = {};
  users.forEach(u => {
    statusCounts[u.registration_status] = (statusCounts[u.registration_status] || 0) + 1;
  });

  // ── Styles ────────────────────────────────────────────────────────────────

  const th: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'left', fontSize: 12,
    fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap',
    backgroundColor: '#f9fafb',
  };
  const td: React.CSSProperties = {
    padding: '11px 14px', borderBottom: '1px solid #f3f4f6',
  };

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

      {/* User detail modal */}
      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {/* Moderation confirmation modal */}
      {moderationModal && (
        <ModerationModal
          user={moderationModal.user}
          action={moderationModal.action}
          onConfirm={executeModerationAction}
          onClose={() => setModerationModal(null)}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Users</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {users.length} registered member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(({ key, label }) => {
          const count = key === 'all' ? users.length : (statusCounts[key] || 0);
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '5px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 400,
                backgroundColor: active
                  ? (key === 'suspended' ? '#f97316' : key === 'banned' ? '#dc2626' : '#15803d')
                  : '#f3f4f6',
                color: active ? 'white' : '#374151',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  backgroundColor: active ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                  color: active ? 'white' : '#6b7280',
                  borderRadius: 8, padding: '0 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + trust filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search name, email, username, GSTN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 7,
            border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
          }}
        />
        <select
          value={trustFilter}
          onChange={e => setTrustFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="all">All Trust Levels</option>
          {TRUST_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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
      ) : paginated.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: 'white',
          borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
        }}>
          No users match the current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>GSTN</th>
                <th style={th}>Status</th>
                <th style={th}>Trust Level</th>
                <th style={th}>Invites</th>
                <th style={th}>Joined</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => {
                const isSuspended = u.registration_status === 'suspended';
                const isBanned = u.registration_status === 'banned';
                const isModerated = isSuspended || isBanned;
                const rowBg = isBanned ? '#fff5f5' : isSuspended ? '#fffbf5' : 'transparent';

                return (
                  <tr
                    key={u.id}
                    style={{ cursor: 'pointer', transition: 'background 0.1s', backgroundColor: rowBg }}
                    onMouseEnter={e => { if (!isModerated) e.currentTarget.style.backgroundColor = '#fafafa'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = rowBg; }}
                  >
                    <td style={td} onClick={() => setSelectedUser(u)}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{u.username}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                      {(u.first_name || u.last_name) && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{u.first_name} {u.last_name}</div>
                      )}
                    </td>
                    <td style={{ ...td, fontSize: 13, color: '#374151', fontFamily: 'monospace' }} onClick={() => setSelectedUser(u)}>
                      {u.gstn || <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={td} onClick={() => setSelectedUser(u)}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: (STATUS_COLORS[u.registration_status] || '#6b7280') + '20',
                        color: STATUS_COLORS[u.registration_status] || '#6b7280',
                      }}>
                        {u.registration_status?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <select
                        value={u.trust_level}
                        disabled={actionLoading === u.id || isBanned}
                        onChange={e => changeTrustLevel(u, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: 6,
                          border: `1px solid ${TRUST_COLORS[u.trust_level] || '#d1d5db'}`,
                          fontSize: 12, color: TRUST_COLORS[u.trust_level] || '#374151',
                          backgroundColor: (TRUST_COLORS[u.trust_level] || '#6b7280') + '15',
                          cursor: isBanned ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {TRUST_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <div
                        onClick={() => actionLoading !== u.id && !isBanned && toggleInvites(u)}
                        style={{
                          width: 36, height: 20, borderRadius: 10, position: 'relative',
                          backgroundColor: u.can_send_invites ? '#15803d' : '#d1d5db',
                          cursor: (actionLoading === u.id || isBanned) ? 'not-allowed' : 'pointer',
                          opacity: isBanned ? 0.5 : 1,
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
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }} onClick={() => setSelectedUser(u)}>
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    {/* ── Action Buttons ── */}
                    <td style={{ ...td, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {isSuspended ? (
                          /* Restore button for suspended users */
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => openModerationModal(u, 'unsuspend')}
                            title="Restore account"
                            style={{
                              padding: '4px 10px', borderRadius: 5, border: '1px solid #86efac',
                              backgroundColor: '#f0fdf4', color: '#15803d',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            }}
                          >
                            Restore
                          </button>
                        ) : !isBanned ? (
                          /* Suspend button for active users */
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => openModerationModal(u, 'suspend')}
                            title="Suspend user"
                            style={{
                              padding: '4px 10px', borderRadius: 5, border: '1px solid #fed7aa',
                              backgroundColor: '#fff7ed', color: '#c2410c',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            }}
                          >
                            Suspend
                          </button>
                        ) : null}

                        {!isBanned && (
                          /* Ban button for non-banned users */
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => openModerationModal(u, 'ban')}
                            title="Permanently ban"
                            style={{
                              padding: '4px 10px', borderRadius: 5, border: '1px solid #fecaca',
                              backgroundColor: '#fef2f2', color: '#dc2626',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            }}
                          >
                            Ban
                          </button>
                        )}

                        {/* Delete button — always available (except admin) */}
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => openModerationModal(u, 'delete')}
                          title="Permanently delete account"
                          style={{
                            padding: '4px 8px', borderRadius: 5, border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb', color: '#6b7280',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600, lineHeight: 1,
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination + count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                backgroundColor: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 13, color: page === 1 ? '#d1d5db' : '#374151',
              }}
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : (page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i));
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '5px 10px', borderRadius: 6,
                    border: `1px solid ${p === page ? '#15803d' : '#d1d5db'}`,
                    backgroundColor: p === page ? '#15803d' : 'white',
                    color: p === page ? 'white' : '#374151',
                    cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 600 : 400,
                    minWidth: 32,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                backgroundColor: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 13, color: page === totalPages ? '#d1d5db' : '#374151',
              }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 8, fontSize: 12, color: '#d1d5db' }}>
        Click any row to see full user details. Suspended rows are highlighted in orange, banned in red.
      </p>
    </div>
  );
}
