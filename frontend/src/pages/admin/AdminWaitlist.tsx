import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

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

const STATUS_OPTIONS = ['waiting', 'invited', 'declined'];

export default function AdminWaitlist(): JSX.Element {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('waiting');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/waitlist?status=${activeStatus}`);
      setEntries(res.data.entries || []);
    } catch {
      showToast('Failed to load waitlist', false);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => { load(); }, [load]);

  const sendInvite = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/waitlist/${id}/invite`);
      showToast('Invite sent successfully');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to send invite', false);
    } finally {
      setActionLoading(null);
    }
  };

  const decline = async (id: number) => {
    if (!window.confirm('Decline this waitlist entry?')) return;
    setActionLoading(id);
    try {
      await api.post(`/admin/waitlist/${id}/decline`);
      showToast('Entry declined');
      load();
    } catch {
      showToast('Failed to decline', false);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      waiting: '#f59e0b',
      invited: '#3b82f6',
      declined: '#ef4444',
      registered: '#10b981',
    };
    return (
      <span style={{
        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
        backgroundColor: (map[s] || '#6b7280') + '20', color: map[s] || '#6b7280',
      }}>
        {s}
      </span>
    );
  };

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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Waitlist</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          People who signed up without an invite link.
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              backgroundColor: activeStatus === s ? '#15803d' : '#e5e7eb',
              color: activeStatus === s ? 'white' : '#374151',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
            backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#374151',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: 'white',
          borderRadius: 10, border: '1px solid #e5e7eb', color: '#9ca3af',
        }}>
          No {activeStatus} entries found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => (
            <div key={e.id} style={{
              backgroundColor: 'white', border: '1px solid #e5e7eb',
              borderRadius: 10, padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                      {e.first_name} {e.last_name}
                    </span>
                    {statusBadge(e.status)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '4px 24px' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>📧 {e.email}</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>📱 {e.mobile_number || '—'}</span>
                    {e.gstn && <span style={{ fontSize: 13, color: '#6b7280' }}>🏢 GSTN: {e.gstn}</span>}
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      Joined {new Date(e.created_at).toLocaleDateString('en-IN')}
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
                        padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        backgroundColor: '#15803d', color: 'white', fontWeight: 600, fontSize: 13,
                        opacity: actionLoading === e.id ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === e.id ? 'Sending...' : '✉ Send Invite'}
                    </button>
                    <button
                      onClick={() => decline(e.id)}
                      disabled={actionLoading === e.id}
                      style={{
                        padding: '8px 18px', borderRadius: 6, border: '1px solid #fca5a5',
                        cursor: 'pointer', backgroundColor: 'white', color: '#dc2626',
                        fontWeight: 500, fontSize: 13,
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
    </div>
  );
}
