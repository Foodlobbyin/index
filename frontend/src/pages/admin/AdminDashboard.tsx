import { useEffect, useState } from 'react';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  active_users: number;
  pending_review: number;
  waitlist: number;
  active_invites: number;
}

interface TrendPoint  { day: string; count: string; }
interface SearchRow   { search_type: string; count: string; }
interface TrustRow    { trust_level: string; count: string; }
interface TopSearch   { search_value: string; search_type: string; count: string; }
interface ActivationRate { active: string; pending: string; declined: string; total: string; }
interface InviteFunnel   { sent: string; used: string; converted: string; }

interface Analytics {
  signups_trend:     TrendPoint[];
  invite_funnel:     InviteFunnel;
  search_activity:   SearchRow[];
  trust_distribution: TrustRow[];
  incidents_trend:   TrendPoint[];
  waitlist_trend:    TrendPoint[];
  top_searches:      TopSearch[];
  activation_rate:   ActivationRate;
  registration_status: { registration_status: string; count: string }[];
}

// ─── Design tokens (kept inline so no CSS file needed) ────────────────────────
const T = {
  bg:       '#F7F6F2',
  surface:  '#FFFFFF',
  border:   '#E8E6E0',
  text:     '#1A1917',
  muted:    '#6B6966',
  faint:    '#B5B3AE',
  green:    '#15803d',
  greenPale:'#dcfce7',
  teal:     '#20808D',
  amber:    '#D97706',
  blue:     '#2563EB',
  purple:   '#7C3AED',
  red:      '#DC2626',
  font:     `'Inter', 'DM Sans', system-ui, -apple-system, sans-serif`,
};

// ─── SVG Area/Line Sparkline ──────────────────────────────────────────────────

function TrendChart({
  raw,
  color,
  label,
  totalLabel,
}: {
  raw: TrendPoint[];
  color: string;
  label: string;
  totalLabel: string;
}) {
  // Build a full 30-day array, filling missing days with 0
  const days30: { day: string; value: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const found = raw.find(r => r.day === key || r.day?.startsWith(key));
    days30.push({ day: key, value: found ? parseInt(found.count) : 0 });
  }

  const total = days30.reduce((a, b) => a + b.value, 0);
  const maxVal = Math.max(...days30.map(d => d.value), 1);

  // SVG path generation
  const W = 320, H = 64, padX = 0, padY = 8;
  const pts = days30.map((d, i) => ({
    x: padX + (i / (days30.length - 1)) * (W - padX * 2),
    y: padY + (1 - d.value / maxVal) * (H - padY * 2),
    v: d.value,
    day: d.day,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `M${pts[0].x.toFixed(1)},${H} ` +
    pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${pts[pts.length - 1].x.toFixed(1)},${H} Z`;

  const gradId = `grad-${color.replace('#', '')}`;

  // Week markers (every 7 days)
  const weekLines = [7, 14, 21].map(i => ({
    x: padX + (i / (days30.length - 1)) * (W - padX * 2),
    label: days30[i]?.day ? new Date(days30[i].day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.font, fontVariantNumeric: 'tabular-nums' }}>
            {total}
          </p>
        </div>
        <span style={{ fontSize: 12, color: T.muted }}>{totalLabel}</span>
      </div>

      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: 68, display: 'block' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Week grid lines */}
          {weekLines.map((wl, i) => (
            <line
              key={i}
              x1={wl.x} y1={0}
              x2={wl.x} y2={H}
              stroke={T.border}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots only on non-zero days */}
          {pts.filter(p => p.v > 0).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="white" strokeWidth="1.5" />
          ))}
        </svg>

        {/* Week date labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 2px' }}>
          <span style={{ fontSize: 10, color: T.faint }}>
            {new Date(days30[0].day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ fontSize: 10, color: T.faint }}>
            {new Date(days30[14].day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ fontSize: 10, color: T.faint }}>Today</span>
        </div>
      </div>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let offset = 0;
  const r = 36, cx = 44, cy = 44, sw = 16, circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={sw} />
        {segments.map((s, i) => {
          const pct   = s.value / total;
          const dash  = pct * circ;
          const gap   = circ - dash;
          const rot   = -Math.PI / 2 + offset * 2 * Math.PI;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              style={{ transition: 'stroke-dasharray 0.6s ease', transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${rot}rad)` }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fontWeight={700} fill={T.text} fontFamily={T.font}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.muted, flex: 1, fontFamily: T.font }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Funnel row ───────────────────────────────────────────────────────────────

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: T.muted, fontFamily: T.font }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      <div style={{ height: 5, backgroundColor: '#F0EDE8', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', backgroundColor: color,
          borderRadius: 3, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  title, children, style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      backgroundColor: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      ...style,
    }}>
      {title && (
        <p style={{
          margin: '0 0 16px', fontSize: 11, fontWeight: 700,
          color: T.muted, textTransform: 'uppercase',
          letterSpacing: '0.08em', fontFamily: T.font,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  label, value, color, href,
}: {
  label: string; value: string | number; color: string; href?: string | null;
}) {
  const inner = (
    <div style={{
      backgroundColor: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: '18px 20px',
      cursor: href ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { if (href) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: T.font }}>
        {label}
      </p>
      <p style={{
        margin: '6px 0 0', fontSize: 30, fontWeight: 700,
        color, lineHeight: 1, fontFamily: T.font,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
    </div>
  );
  return href
    ? <a href={href} style={{ textDecoration: 'none' }}>{inner}</a>
    : <div>{inner}</div>;
}

// ─── Decision banner ──────────────────────────────────────────────────────────

function DecisionBanner({ stats, analytics }: { stats: Stats; analytics: Analytics | null }) {
  const messages: { text: string; type: 'action' | 'warn' | 'info' }[] = [];

  if (stats.pending_review > 0)
    messages.push({ text: `${stats.pending_review} user${stats.pending_review > 1 ? 's' : ''} waiting for approval — review now.`, type: 'action' });

  if (analytics) {
    const total = parseInt(analytics.activation_rate.total) || 0;
    const active = parseInt(analytics.activation_rate.active) || 0;
    const searchTotal = analytics.search_activity.reduce((a, b) => a + parseInt(b.count), 0);
    if (total > 5 && active / total < 0.5)
      messages.push({ text: `Activation rate is ${Math.round((active / total) * 100)}% — more than half of registered users aren't active yet.`, type: 'warn' });
    if (searchTotal === 0)
      messages.push({ text: 'No searches in 30 days — users aren\'t engaging with the core feature yet. Consider targeted outreach or onboarding guidance.', type: 'warn' });
    else if (searchTotal < 5)
      messages.push({ text: `Only ${searchTotal} searches in 30 days — engagement is low. More marketing or user activation may help.`, type: 'info' });
    if (stats.waitlist > stats.pending_review && stats.waitlist > 3)
      messages.push({ text: `Waitlist (${stats.waitlist}) growing faster than direct signups — marketing is working. Keep send-invite cadence high.`, type: 'info' });
    const signupSum = analytics.signups_trend.reduce((a, b) => a + parseInt(b.count), 0);
    if (total > 0 && signupSum === 0)
      messages.push({ text: 'No new signups in 30 days. Time to push a fresh marketing campaign.', type: 'warn' });
  }

  if (!messages.length) return null;

  const typeMap = {
    action: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
    warn:   { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', dot: '#F97316' },
    info:   { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
      {messages.map((m, i) => {
        const s = typeMap[m.type];
        return (
          <div key={i} style={{
            backgroundColor: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, marginTop: 5, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: s.text, lineHeight: 1.55, fontFamily: T.font }}>{m.text}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard(): JSX.Element {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError]       = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setError('');
    setLoading(true);
    Promise.all([api.get('/admin/stats'), api.get('/admin/analytics')])
      .then(([s, a]) => {
        setStats(s.data);
        setAnalytics(a.data);
        setLastUpdated(new Date());
      })
      .catch(err => setError(
        err?.response?.data?.error ||
        (err?.response?.status ? `Server error ${err.response.status}` : 'Could not reach server'),
      ))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── derived ────────────────────────────────────────────────────────────────

  const trustColors: Record<string, string> = {
    basic: '#9CA3AF', verified: '#3B82F6', trusted: '#8B5CF6',
    moderator: '#F59E0B', admin: '#EF4444',
  };
  const trustSegments = (analytics?.trust_distribution ?? []).map(r => ({
    label: r.trust_level, value: parseInt(r.count), color: trustColors[r.trust_level] || '#9CA3AF',
  }));

  const searchGstn   = parseInt(analytics?.search_activity.find(s => s.search_type === 'gstn')?.count   ?? '0');
  const searchMobile = parseInt(analytics?.search_activity.find(s => s.search_type === 'mobile')?.count ?? '0');
  const searchTotal  = searchGstn + searchMobile;

  const inviteSent      = parseInt(analytics?.invite_funnel.sent      ?? '0');
  const inviteUsed      = parseInt(analytics?.invite_funnel.used      ?? '0');
  const inviteConverted = parseInt(analytics?.invite_funnel.converted ?? '0');

  const activationTotal  = parseInt(analytics?.activation_rate.total  ?? '0');
  const activationActive = parseInt(analytics?.activation_rate.active ?? '0');
  const activationRate   = activationTotal > 0 ? Math.round((activationActive / activationTotal) * 100) : 0;

  const tiles = stats ? [
    { label: 'Active Users',    value: stats.active_users,    color: T.green,  href: '/admin/users' },
    { label: 'Pending Review',  value: stats.pending_review,  color: T.amber,  href: '/admin/queue' },
    { label: 'Waitlist',        value: stats.waitlist,        color: T.blue,   href: '/admin/queue' },
    { label: 'Active Invites',  value: stats.active_invites,  color: T.purple, href: '/admin/invites' },
    { label: 'Activation Rate', value: `${activationRate}%`,  color: '#0891B2', href: null },
    { label: 'Searches (30d)',  value: searchTotal,           color: T.text,   href: null },
  ] : [];

  return (
    <div style={{ fontFamily: T.font }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Dashboard</h1>
          {lastUpdated && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: T.faint }}>
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </p>
          )}
        </div>
        <button
          onClick={load}
          style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
            backgroundColor: T.surface, cursor: 'pointer', fontSize: 13,
            color: T.muted, fontFamily: T.font, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>↻</span> Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 18,
        }}>
          Failed to load: {error}
          <button onClick={load} style={{ marginLeft: 12, padding: '2px 10px', borderRadius: 5, border: '1px solid #DC2626', backgroundColor: 'white', color: '#DC2626', cursor: 'pointer', fontSize: 12 }}>Retry</button>
        </div>
      )}

      {loading && !stats && (
        <p style={{ color: T.faint, fontSize: 14 }}>Loading...</p>
      )}

      {stats && (
        <>
          <DecisionBanner stats={stats} analytics={analytics} />

          {/* KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {tiles.map(t => <KpiTile key={t.label} {...t} />)}
          </div>

          {/* Row 1: 3 trend charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
            <Card>
              <TrendChart
                raw={analytics?.signups_trend ?? []}
                color={T.green}
                label="User Signups"
                totalLabel="last 30 days"
              />
            </Card>
            <Card>
              <TrendChart
                raw={analytics?.incidents_trend ?? []}
                color={T.purple}
                label="Incident Reports"
                totalLabel="last 30 days"
              />
            </Card>
            <Card>
              <TrendChart
                raw={analytics?.waitlist_trend ?? []}
                color={T.blue}
                label="Waitlist Growth"
                totalLabel="last 30 days"
              />
            </Card>
          </div>

          {/* Row 2: Trust + Invite funnel + Search */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="User Trust Levels">
              {trustSegments.length > 0
                ? <DonutChart segments={trustSegments} />
                : <p style={{ color: T.faint, fontSize: 13, margin: 0 }}>No users yet</p>}
            </Card>

            <Card title="Invite Funnel">
              <FunnelRow label="Invites Sent"       value={inviteSent}      max={inviteSent} color={T.green} />
              <FunnelRow label="Invites Used"        value={inviteUsed}      max={inviteSent} color="#16A34A" />
              <FunnelRow label="Converted to Active" value={inviteConverted} max={inviteSent} color="#86EFAC" />
              <p style={{ margin: '10px 0 0', fontSize: 11, color: T.faint, fontFamily: T.font }}>
                {inviteSent > 0
                  ? `${Math.round((inviteUsed / inviteSent) * 100)}% use rate`
                  : 'No invites sent yet'}
              </p>
            </Card>

            <Card title="Search Activity — 30 Days">
              <FunnelRow label="GSTN Searches"   value={searchGstn}   max={Math.max(searchGstn, searchMobile, 1)} color={T.teal} />
              <FunnelRow label="Mobile Searches" value={searchMobile} max={Math.max(searchGstn, searchMobile, 1)} color={T.purple} />
              <p style={{ margin: '10px 0 0', fontSize: 11, color: T.faint, fontFamily: T.font }}>
                {searchTotal > 0
                  ? `${searchTotal} total searches`
                  : 'No searches yet — core feature not in use'}
              </p>
            </Card>
          </div>

          {/* Row 3: Top Searches */}
          {(analytics?.top_searches ?? []).length > 0 && (
            <Card title="Top Searched This Month" style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                {analytics!.top_searches.slice(0, 8).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 11, color: T.faint, width: 16, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: T.text, flex: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.search_value}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 7px', borderRadius: 8,
                      backgroundColor: s.search_type === 'gstn' ? '#E0F2FE' : '#F3E8FF',
                      color: s.search_type === 'gstn' ? '#0369A1' : '#7C3AED',
                      fontWeight: 600,
                    }}>
                      {s.search_type}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.count}×</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <div style={{
            backgroundColor: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: '16px 22px',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.pending_review > 0 && (
                <a href="/admin/queue" style={{ padding: '7px 16px', borderRadius: 8, backgroundColor: T.amber, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Review {stats.pending_review} Pending
                </a>
              )}
              {stats.waitlist > 0 && (
                <a href="/admin/queue" style={{ padding: '7px 16px', borderRadius: 8, backgroundColor: T.blue, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Waitlist ({stats.waitlist})
                </a>
              )}
              <a href="/admin/invites" style={{ padding: '7px 16px', borderRadius: 8, backgroundColor: T.green, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Send Invite
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
