import React, { useState } from 'react';
import { UserPlus, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Trust levels that can send invites
const INVITE_ELIGIBLE: string[] = ['verified', 'trusted', 'moderator', 'admin'];

const InviteWidget: React.FC = () => {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Only render for verified members and above
  if (!user?.trust_level || !INVITE_ELIGIBLE.includes(user.trust_level)) {
    return null;
  }

  const resetForm = () => {
    setEmail('');
    setCompanyName('');
    setResult(null);
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (open) resetForm();
  };

  const handleSend = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setResult({ ok: false, msg: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      await api.post('/invite/send', {
        email: trimmedEmail.toLowerCase(),
        company_name: companyName.trim() || undefined,
      });
      setResult({
        ok: true,
        msg: `Invitation sent to ${trimmedEmail}. They will receive a personal invite email shortly.`,
      });
      setEmail('');
      setCompanyName('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        'Could not send the invitation. Please try again.';
      setResult({ ok: false, msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 32,
        borderTop: '1px solid #e5e7eb',
        paddingTop: 28,
      }}
    >
      {/* Collapsed state — CTA banner */}
      {!open && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '16px 20px',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserPlus size={20} color="#15803d" />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#166534',
                  lineHeight: 1.4,
                }}
              >
                Know someone in the food & spice trade?
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 13,
                  color: '#4b7a58',
                  lineHeight: 1.5,
                }}
              >
                If you find FoodLobby valuable, invite a trusted colleague.
                A stronger network protects everyone in the trade.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#15803d',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
            }}
          >
            <UserPlus size={15} />
            Invite a Colleague
          </button>
        </div>
      )}

      {/* Expanded invite form */}
      {open && (
        <div
          style={{
            backgroundColor: 'white',
            border: '1.5px solid #15803d',
            borderRadius: 12,
            padding: '24px 24px 20px',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserPlus size={18} color="#15803d" />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Invite a Colleague
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  They will receive a personal, single-use invite link by email.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: '#f3f4f6',
              margin: '14px 0 18px',
            }}
          />

          {/* Form fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
              gap: 12,
              marginBottom: 14,
            }}
            className="invite-form-grid"
          >
            {/* Email — required */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 5,
                }}
              >
                Email Address{' '}
                <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@theircompany.com"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  boxSizing: 'border-box' as const,
                  outline: 'none',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            </div>

            {/* Company Name — optional */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 5,
                }}
              >
                Company / Firm{' '}
                <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Patel Spices Pvt. Ltd."
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  boxSizing: 'border-box' as const,
                  outline: 'none',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            </div>
          </div>

          {/* Result feedback */}
          {result && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 14,
                backgroundColor: result.ok ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.ok ? '#86efac' : '#fca5a5'}`,
              }}
            >
              {result.ok ? (
                <CheckCircle size={16} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
              )}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: result.ok ? '#166534' : '#991b1b',
                  lineHeight: 1.5,
                }}
              >
                {result.msg}
              </p>
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
              Invite is valid for 30 days · single-use · locked to their email
            </p>
            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor:
                  loading || !email.trim() ? '#86efac' : '#15803d',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !email.trim() ? 0.7 : 1,
                transition: 'background-color 0.15s',
              }}
            >
              <Send size={14} />
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteWidget;
