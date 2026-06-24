import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface InviteToken {
  id: number;
  token: string;
  type: 'marketing' | 'member';
  invited_email: string;
  invited_by_username: string | null;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function AdminInvites(): JSX.Element {
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Send Invite form state
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ email: string; url: string; emailSent: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/invites');
      setInvites(res.data.invites || []);
    } catch {
      showToast('Failed to load invites', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Send invite ──────────────────────────────────────────────────────────────
  const sendInvite = async () => {
    if (!firstName.trim()) return showToast('First name is required', false);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showToast('Enter a valid email address', false);
    }
    setSending(true);
    setSentResult(null);
    try {
      const res = await api.post('/admin/invite-direct', {
        first_name: firstName.trim(),
        company_name: companyName.trim() || undefined,
        email: email.trim().toLowerCase(),
      });

      const { invite_url, email_sent } = res.data;
      setSentResult({ email: email.trim().toLowerCase(), url: invite_url, emailSent: email_sent });

      if (email_sent) {
        showToast(`Invitation sent to ${email.trim()}`, true);
      } else {
        showToast('Token created — email delivery failed. Copy the link manually.', false);
      }

      setFirstName('');
      setCompanyName('');
      setEmail('');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to send invitation', false);
    } finally {
      setSending(false);
    }
  };

  // ── Revoke ───────────────────────────────────────────────────────────────────
  const revoke = async (id: number, invEmail: string) => {
    if (!window.confirm(`Revoke invite for ${invEmail}?`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/invites/${id}/revoke`);
      showToast('Invite revoked');
      load();
    } catch {
      showToast('Failed to revoke invite', false);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard'));
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const typeBadge = (type: string) => (
    <span style={{
      padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      backgroundColor: type === 'marketing' ? '#dbeafe' : '#d1fae5',
      color: type === 'marketing' ? '#1d4ed8' : '#065f46',
      textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    }}>
      {type}
    </span>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: '#f59e0b', used: '#10b981', expired: '#9ca3af', revoked: '#ef4444',
    };
    return (
      <span style={{
        padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        backgroundColor: (map[status] || '#9ca3af') + '20',
        color: map[status] || '#9ca3af',
      }}>
        {status}
      </span>
    );
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const filtered = invites.filter(inv =>
    (filterType === 'all' || inv.type === filterType) &&
    (filterStatus === 'all' || inv.status === filterStatus)
  );

  // ── Styles ───────────────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 7,
    border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  // ── Render ───────────────────────────────────────────────────────────────────
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

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Invite Tokens</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Send personal invitation emails or view all generated invite links.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSentResult(null); }}
          style={{
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: showForm ? '#f3f4f6' : '#15803d',
            color: showForm ? '#374151' : 'white', fontWeight: 600, fontSize: 14,
          }}
        >
          {showForm ? '✕ Close Form' : '✉ Send Invitation'}
        </button>
      </div>

      {/* ── Send Invite Form ──────────────────────────────────────────────── */}
      {showForm && (
        <div style={{
          backgroundColor: 'white', border: '2px solid #15803d', borderRadius: 12,
          padding: 28, marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#15803d' }}>
            ✉ Send Personal Invitation
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            Fill in the recipient's details. A branded marketing email with a
            personalised invite link will be sent directly to their inbox.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* First Name */}
            <div>
              <label style={labelStyle}>
                First Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Rajesh"
                style={inputStyle}
              />
            </div>

            {/* Company Name */}
            <div>
              <label style={labelStyle}>Company / Firm Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Patel Spices Pvt. Ltd."
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Email Address <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. rajesh@patelspices.com"
              style={{ ...inputStyle, maxWidth: 420 }}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
            />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#9ca3af' }}>
              The invite link will be locked to this email. Recipient must register with this exact address.
            </p>
          </div>

          {/* Preview card */}
          {(firstName || companyName || email) && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '12px 16px', marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
                <strong>Preview:</strong> Email will greet &ldquo;Dear{' '}
                <strong>{firstName || '___'}</strong>{companyName ? `, representing ${companyName}` : ''}&rdquo;
                {email ? ` and be sent to ${email}` : ''}.
              </p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={sendInvite}
            disabled={sending || !firstName.trim() || !email.trim()}
            style={{
              padding: '11px 28px', borderRadius: 8, border: 'none',
              cursor: sending || !firstName.trim() || !email.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: sending || !firstName.trim() || !email.trim() ? '#86efac' : '#15803d',
              color: 'white', fontWeight: 700, fontSize: 14,
              opacity: sending || !firstName.trim() || !email.trim() ? 0.7 : 1,
            }}
          >
            {sending ? '⏳ Sending…' : '✉ Send Invitation Email'}
          </button>

          {/* Result banner */}
          {sentResult && (
            <div style={{
              marginTop: 18, padding: '14px 18px', borderRadius: 8,
              backgroundColor: sentResult.emailSent ? '#f0fdf4' : '#fef9c3',
              border: `1px solid ${sentResult.emailSent ? '#86efac' : '#fde047'}`,
            }}>
              {sentResult.emailSent ? (
                <p style={{ margin: 0, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  ✅ Invitation email delivered to <strong>{sentResult.email}</strong>
                </p>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                    ⚠️ Token created but email delivery failed — copy link to send manually:
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 12, color: '#374151', wordBreak: 'break-all', flex: 1 }}>
                      {sentResult.url}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(sentResult.url).then(() => showToast('Copied!'))}
                      style={{
                        padding: '4px 12px', borderRadius: 5, border: '1px solid #d97706',
                        backgroundColor: 'white', color: '#d97706', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </>
              )}
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>
                Valid 30 days · Single use · Locked to {sentResult.email}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Filters row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="all">All Types</option>
          <option value="marketing">Marketing</option>
          <option value="member">Member</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9ca3af' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={load}
          style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
            backgroundColor: 'white', cursor: 'pointer', fontSize: 13,
          }}
        >
          ↻
        </button>
      </div>

      {/* ── Invite table ──────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: 'white',
          borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
        }}>
          No invites found. Send your first invitation using the button above.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', backgroundColor: 'white',
            borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Invited Email', 'Type', 'Status', 'Sent By', 'Created', 'Expires', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const expired = isExpired(inv.expires_at);
                const effectiveStatus = expired && inv.status === 'pending' ? 'expired' : inv.status;
                return (
                  <tr key={inv.id} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                    opacity: inv.status === 'revoked' ? 0.55 : 1,
                  }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                      {inv.invited_email}
                    </td>
                    <td style={{ padding: '11px 14px' }}>{typeBadge(inv.type)}</td>
                    <td style={{ padding: '11px 14px' }}>{statusBadge(effectiveStatus)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#6b7280' }}>
                      {inv.invited_by_username || <span style={{ color: '#d1d5db' }}>Admin</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{
                      padding: '11px 14px', fontSize: 12, whiteSpace: 'nowrap',
                      color: expired ? '#ef4444' : '#9ca3af',
                    }}>
                      {new Date(inv.expires_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {inv.status === 'pending' && !expired && (
                          <>
                            <button
                              onClick={() => copyLink(inv.token)}
                              title="Copy invite link"
                              style={{
                                padding: '4px 10px', borderRadius: 5, border: '1px solid #d1d5db',
                                backgroundColor: 'white', cursor: 'pointer', fontSize: 12,
                              }}
                            >
                              📋 Copy
                            </button>
                            <button
                              onClick={() => revoke(inv.id, inv.invited_email)}
                              disabled={actionLoading === inv.id}
                              style={{
                                padding: '4px 10px', borderRadius: 5, border: '1px solid #fca5a5',
                                backgroundColor: 'white', color: '#dc2626', cursor: 'pointer',
                                fontSize: 12, opacity: actionLoading === inv.id ? 0.6 : 1,
                              }}
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
