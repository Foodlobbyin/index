import { useEffect, useState } from 'react';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  active_users: number;
  pending_review: number;
  waitlist: number;
  active_invites: number;
}

interface TrendPoint { day: string; count: string; }
interface SearchRow { search_type: string; count: string; }
interface TrustRow { trust_level: string; count: string; }
interface TopSearch { search_value: string; search_type: string; count: string; }
interface ActivationRate { active: string; pending: string; declined: string; total: string; }
interface InviteFunnel { sent: string; used: string; converted: string; }

interface Analytics {
  signups_trend: TrendPoint[];
  invite_funnel: InviteFunnel;
  search_activity: SearchRow[];
  trust_distribution: TrustRow[];
  incidents_trend: TrendPoint[];
  waitlist_trend: TrendPoint[];
  top_searches: TopSearch[];
  activation_rate: ActivationRate;
  registration_status: { registration_status: string; count: string }[];
}

// ── Mini chart helpers (no deps, pure DOM) ────────────────────────────────────

function BarChart({
  data, color = '#15803d', height = 80, label,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  label?: string;
}) {
  if (!data.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9ca3af' }}>{label}</p>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.label}: ${d.value}`}
            style={{
              flex: 1, backgroundColor: color,
              height: `${Math.max((d.value / max) * height, d.value > 0 ? 3 : 0)}px`,
              borderRadius: '2px 2px 0 0', opacity: 0.85,
              transition: 'height 0.3s',
              minWidth: 4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let offset = 0;
  const r = 38, cx = 50, cy = 50, strokeW = 18;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {segments.map((s, i) => {
          const pct = s.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              style={{ transition: 'stroke-dasharray 0.5s' }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#111827">
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginLeft: 'auto' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{value}</span>
      </div>
      <div style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

// ── Decision helper ───────────────────────────────────────────────────────────

function DecisionBanner({ stats, analytics }: { stats: Stats; analytics: Analytics | null }) {
  const messages: { text: string; type: 'action' | 'info' | 'warn' }[] = [];

  if (stats.pending_review > 0) {
    messages.push({ text: `${stats.pending_review} user${stats.pending_review > 1 ? 's' : ''} waiting for approval — review now to keep momentum.`, type: 'action' });
  }

  if (analytics) {
    const total = parseInt(analytics.activation_rate.total) || 0;
    const active = parseInt(analytics.activation_rate.active) || 0;
    const searchTotal = analytics.search_activity.reduce((a, b) => a + parseInt(b.count), 0);

    if (total > 5 && active / total < 0.5) {
      messages.push({ text: `Activation rate is ${Math.round((active / total) * 100)}% — more than half of registered users aren't active yet. Focus on approvals.`, type: 'warn' });
    }

    if (searchTotal === 0) {
      messages.push({ text: 'No searches recorded in the last 30 days — users aren\'t engaging with the core feature yet. Consider targeted outreach or onboarding guidance.', type: 'warn' });
    } else if (searchTotal < 5) {
      messages.push({ text: `Only ${searchTotal} searches in the last 30 days — engagement is low. More marketing or user activation may help.`, type: 'info' });
    }

    if (stats.waitlist > stats.pending_review && stats.waitlist > 3) {
      messages.push({ text: `Waitlist (${stats.waitlist}) is growing faster than direct signups — marketing is working. Keep send-invite cadence high.`, type: 'info' });
    }

    const signupSum = analytics.signups_trend.reduce((a, b) => a + parseInt(b.count), 0);
    if (total > 0 && signupSum === 0) {
      messages.push({ text: 'No new signups in the last 30 days. Time to push a fresh marketing campaign.', type: 'warn' });
    }
  }

  if (!messages.length) return null;

  const typeStyles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    action: { bg: '#fef9c3', border: '#fde047', color: '#854d0e', icon: '→' },
    warn:   { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', icon: '!' },
    info:   { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'i' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
      {messages.map((m, i) => {
        const s = typeStyles[m.type];
        return (
          <div key={i} style={{
            backgroundColor: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 8, padding: '10px 16px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', backgroundColor: s.border,
              color: s.color, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {s.icon}
            </span>
            <p style={{ margin: 0, fontSize: 13, color: s.color, lineHeight: 1.5 }}>{m.text}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: 'white', border: '1px solid #e5e7eb',
      borderRadius: 10, padding: '18px 20px', ...style,
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = () => {
    setError('');
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/analytics'),
    ])
      .then(([s, a]) => {
        setStats(s.data);
        setAnalytics(a.data);
        setLastUpdated(new Date());
      })
      .catch(err => {
        setError(
          err?.response?.data?.error ||
          (err?.response?.status ? `Server error ${err.response.status}` : 'Could not reach server'),
        );
      });
  };

  useEffect(() => { load(); }, []);

  // ── Derived chart data ──────────────────────────────────────────────────

  const signupsChart = analytics?.signups_trend.map(d => ({
    label: d.day,
    value: parseInt(d.count),
  })) ?? [];

  const incidentsChart = analytics?.incidents_trend.map(d => ({
    label: d.day,
    value: parseInt(d.count),
  })) ?? [];

  const waitlistChart = analytics?.waitlist_trend.map(d => ({
    label: d.day,
    value: parseInt(d.count),
  })) ?? [];

  const trustColors: Record<string, string> = {
    basic: '#9ca3af', verified: '#3b82f6', trusted: '#8b5cf6',
    moderator: '#f59e0b', admin: '#ef4444',
  };

  const trustSegments = (analytics?.trust_distribution ?? []).map(r => ({
    label: r.trust_level,
    value: parseInt(r.count),
    color: trustColors[r.trust_level] || '#6b7280',
  }));

  const searchGstn = parseInt(analytics?.search_activity.find(s => s.search_type === 'gstn')?.count ?? '0');
  const searchMobile = parseInt(analytics?.search_activity.find(s => s.search_type === 'mobile')?.count ?? '0');
  const searchTotal = searchGstn + searchMobile;

  const inviteSent = parseInt(analytics?.invite_funnel.sent ?? '0');
  const inviteUsed = parseInt(analytics?.invite_funnel.used ?? '0');
  const inviteConverted = parseInt(analytics?.invite_funnel.converted ?? '0');

  const activationTotal = parseInt(analytics?.activation_rate.total ?? '0');
  const activationActive = parseInt(analytics?.activation_rate.active ?? '0');
  const activationRate = activationTotal > 0 ? Math.round((activationActive / activationTotal) * 100) : 0;

  // ── KPI tiles ───────────────────────────────────────────────────────────

  const tiles = stats ? [
    { label: 'Active Users', value: stats.active_users, color: '#16a34a', bg: '#f0fdf4', href: '/admin/users' },
    { label: 'Pending Review', value: stats.pending_review, color: '#d97706', bg: '#fffbeb', href: '/admin/queue' },
    { label: 'Waitlist', value: stats.waitlist, color: '#2563eb', bg: '#eff6ff', href: '/admin/queue' },
    { label: 'Active Invites', value: stats.active_invites, color: '#7c3aed', bg: '#f5f3ff', href: '/admin/invites' },
    { label: 'Activation Rate', value: `${activationRate}%`, color: '#0891b2', bg: '#ecfeff', href: null },
    { label: 'Searches (30d)', value: searchTotal, color: '#374151', bg: '#f9fafb', href: null },
  ] : [];

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </span>
          )}
          <button
            onClick={load}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#374151',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div style={{
          padding: '14px 18px', borderRadius: 8, backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16,
        }}>
          Failed to load data: {error}
          <button onClick={load} style={{ marginLeft: 12, padding: '3px 10px', borderRadius: 5, border: '1px solid #dc2626', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>
            Retry
          </button>
        </div>
      ) : !stats ? (
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      ) : (
        <>
          {/* Decision banner */}
          <DecisionBanner stats={stats} analytics={analytics} />

          {/* KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {tiles.map(({ label, value, color, bg, href }) => {
              const inner = (
                <div style={{ backgroundColor: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '16px 20px', cursor: href ? 'pointer' : 'default' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{label}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color }}>{value}</p>
                </div>
              );
              return href
                ? <a key={label} href={href} style={{ textDecoration: 'none' }}>{inner}</a>
                : <div key={label}>{inner}</div>;
            })}
          </div>

          {/* Charts row 1: Signups + Incidents */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="User Signups — Last 30 Days">
              <BarChart data={signupsChart} color="#15803d" height={80} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {signupsChart.reduce((a, b) => a + b.value, 0)} new registrations
              </p>
            </Card>
            <Card title="Incident Reports — Last 30 Days">
              <BarChart data={incidentsChart} color="#7c3aed" height={80} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {incidentsChart.reduce((a, b) => a + b.value, 0)} reports submitted
              </p>
            </Card>
          </div>

          {/* Charts row 2: Waitlist growth + Trust distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Waitlist Growth — Last 30 Days">
              <BarChart data={waitlistChart} color="#2563eb" height={80} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {waitlistChart.reduce((a, b) => a + b.value, 0)} new signups
              </p>
            </Card>
            <Card title="User Trust Levels">
              {trustSegments.length > 0
                ? <DonutChart segments={trustSegments} />
                : <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No users yet</p>}
            </Card>
          </div>

          {/* Charts row 3: Invite funnel + Search activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Invite Funnel">
              <FunnelBar label="Invites Sent" value={inviteSent} max={inviteSent} color="#15803d" />
              <FunnelBar label="Invites Used" value={inviteUsed} max={inviteSent} color="#16a34a" />
              <FunnelBar label="Converted to Active" value={inviteConverted} max={inviteSent} color="#86efac" />
              <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {inviteSent > 0 ? `${Math.round((inviteUsed / inviteSent) * 100)}% use rate` : 'No invites sent yet'}
              </p>
            </Card>
            <Card title="Search Activity — Last 30 Days">
              <div style={{ marginBottom: 14 }}>
                <FunnelBar label="GSTN Searches" value={searchGstn} max={Math.max(searchGstn, searchMobile, 1)} color="#0891b2" />
                <FunnelBar label="Mobile Searches" value={searchMobile} max={Math.max(searchGstn, searchMobile, 1)} color="#7c3aed" />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                {searchTotal > 0
                  ? `${searchTotal} total searches — core feature in use`
                  : 'No searches yet — users not engaging with search'}
              </p>
            </Card>
          </div>

          {/* Top searched companies */}
          {(analytics?.top_searches ?? []).length > 0 && (
            <Card title="Top Searched This Month" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analytics!.top_searches.slice(0, 8).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', width: 16, textAlign: 'right' }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#111827', flex: 1, fontFamily: 'monospace' }}>{s.search_value}</span>
                    <span style={{
                      fontSize: 11, padding: '1px 8px', borderRadius: 10,
                      backgroundColor: s.search_type === 'gstn' ? '#e0f2fe' : '#f3e8ff',
                      color: s.search_type === 'gstn' ? '#0369a1' : '#7c3aed',
                    }}>
                      {s.search_type}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 28, textAlign: 'right' }}>
                      {s.count}×
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <div style={{
            backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '16px 20px',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.pending_review > 0 && (
                <a href="/admin/queue" style={{ padding: '7px 16px', borderRadius: 6, backgroundColor: '#d97706', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Review {stats.pending_review} Pending
                </a>
              )}
              {stats.waitlist > 0 && (
                <a href="/admin/queue" style={{ padding: '7px 16px', borderRadius: 6, backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Waitlist ({stats.waitlist})
                </a>
              )}
              <a href="/admin/invites" style={{ padding: '7px 16px', borderRadius: 6, backgroundColor: '#15803d', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Send Invite
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
