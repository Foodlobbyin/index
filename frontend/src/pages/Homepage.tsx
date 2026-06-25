import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, AlertTriangle, Shield, FileText,
  Users, MessageSquare, Star, Eye, TrendingDown, ChevronDown,
} from 'lucide-react';

const Homepage: React.FC = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(145deg, #0F3D25 0%, #1C5C3A 45%, #1A5035 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="text-white py-24"
      >
        {/* Subtle texture overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">

            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src="/logo-lockup.png"
                alt="FoodLobby"
                style={{ height: '56px', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
              />
            </div>

            {/* Urgency badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-sm font-medium"
              style={{
                background: 'rgba(200, 151, 59, 0.18)',
                border: '1px solid rgba(200, 151, 59, 0.45)',
                color: '#E5B55A',
              }}
            >
              <AlertTriangle size={14} />
              Credit fraud is rising across India's food &amp; spice trade
            </div>

            <h1
              className="fl-heading mb-6 text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
            >
              Protect Your Business from<br />
              <span style={{ color: '#E5B55A' }}>Trade Fraud &amp; Credit Scams</span>
            </h1>

            <p className="mb-3 leading-relaxed" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.82)' }}>
              A community-driven platform for food &amp; spice commodity professionals to report,
              search, and stay protected from buyers who default on payments.
            </p>
            <p className="mb-10" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)' }}>
              Before you extend credit to a new buyer — check if others have already been cheated by them.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <button className="fl-btn-gold" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
                  Search Incident Reports
                </button>
              </Link>
              <button className="fl-btn-outline-white" onClick={scrollToFeatures}>
                How It Works <ChevronDown size={16} className="ml-1" />
              </button>
            </div>

            {/* Subtle trust bar */}
            <div className="mt-14 flex flex-wrap justify-center gap-8" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span>Invite-Only Access</span>
              <span style={{ color: 'rgba(255,255,255,0.18)' }}>|</span>
              <span>Verified Members</span>
              <span style={{ color: 'rgba(255,255,255,0.18)' }}>|</span>
              <span>Food &amp; Spice Trade</span>
              <span style={{ color: 'rgba(255,255,255,0.18)' }}>|</span>
              <span>India-wide Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ────────────────────────────────────────────── */}
      <section style={{ background: '#F0F5F1', borderBottom: '1px solid #D9EDE2' }} className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2
                className="fl-heading"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', color: '#1E2A24', marginBottom: '0.5rem' }}
              >
                A common scam pattern in the food trade
              </h2>
              <div className="fl-divider" />
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: '1', icon: '🤝', title: 'Trust Building', desc: 'Buyer places small orders, pays on time, builds good rapport over weeks or months.' },
                { step: '2', icon: '📦', title: 'Large Credit Order', desc: 'Once trust is established, buyer requests a large consignment on credit — promising payment within 30–60 days.' },
                { step: '3', icon: '🚪', title: 'Disappears', desc: 'Payment never arrives. Buyer stops responding. Legal recourse is expensive and slow.' },
                { step: '4', icon: '🔁', title: 'Repeats Elsewhere', desc: 'The same person moves on to the next unsuspecting vendor, repeating the cycle.' },
              ].map(({ step, icon, title, desc }) => (
                <div
                  key={step}
                  style={{
                    background: '#fff',
                    borderRadius: '0.875rem',
                    border: '1px solid #D9EDE2',
                    padding: '1.5rem 1.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C8973B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                    Step {step}
                  </div>
                  <h3 style={{ fontWeight: 700, color: '#1E2A24', fontSize: '0.95rem', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" }}>{title}</h3>
                  <p style={{ fontSize: '0.825rem', color: '#4B6358', lineHeight: 1.55, marginBottom: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: '#F7F9F7' }} className="section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="fl-heading"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', color: '#1E2A24', marginBottom: '0.5rem' }}
            >
              How FoodLobby Protects You
            </h2>
            <div className="fl-divider" />
            <p style={{ color: '#4B6358', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto' }}>
              Community intelligence tools built specifically for food &amp; spice commodity professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {[
              {
                icon: <Search className="w-5 h-5" style={{ color: '#1C5C3A' }} />,
                iconBg: '#DCF0E5',
                title: 'Search Before You Trust',
                desc: 'Instantly search any company by name, GSTIN, or phone number to see if past incidents have been reported against them by other community members.',
              },
              {
                icon: <AlertTriangle className="w-5 h-5" style={{ color: '#C8973B' }} />,
                iconBg: '#FBF0DC',
                title: 'Report Fraud Incidents',
                desc: 'Submit detailed incident reports — credit defaults, payment fraud, cheque bounces, or breach of trade agreements — so others in the industry are warned in time.',
              },
              {
                icon: <Star className="w-5 h-5" style={{ color: '#C8973B' }} />,
                iconBg: '#FBF0DC',
                title: 'Reputation Scores',
                desc: 'Every company profile carries a community-driven reputation score based on verified incident reports, helping you quickly assess the risk of a new trade relationship.',
              },
              {
                icon: <FileText className="w-5 h-5" style={{ color: '#1C5C3A' }} />,
                iconBg: '#DCF0E5',
                title: 'Invoice & Evidence Logging',
                desc: 'Attach invoices and payment evidence to your reports, creating a timestamped, verifiable record that strengthens the community\'s case.',
              },
              {
                icon: <Eye className="w-5 h-5" style={{ color: '#2D3748' }} />,
                iconBg: '#E8ECF2',
                title: 'Pattern Detection',
                desc: 'When multiple vendors report the same party, the platform flags them as high-risk, exposing systematic fraudsters who operate across multiple regions.',
              },
              {
                icon: <MessageSquare className="w-5 h-5" style={{ color: '#C8973B' }} />,
                iconBg: '#FBF0DC',
                title: <>Community Forum <span style={{ fontSize: '0.7rem', background: '#FBF0DC', color: '#C8973B', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 600, marginLeft: '0.35rem' }}>Coming Soon</span></>,
                desc: 'A dedicated space for commodity professionals to share fraud alerts, industry experiences, and advice — making the trade ecosystem safer for everyone.',
              },
            ].map((item, i) => (
              <div key={i} className="fl-card">
                <div className="flex items-start gap-4">
                  <div className="fl-icon-box" style={{ background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: '#1E2A24', fontSize: '1rem', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>
                      {item.title}
                    </h3>
                    <p style={{ color: '#4B6358', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ background: '#fff' }} className="section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="fl-heading"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', color: '#1E2A24', marginBottom: '0.5rem' }}
            >
              Three Steps to Stay Protected
            </h2>
            <div className="fl-divider" />
            <p style={{ color: '#4B6358', fontSize: '1.05rem' }}>
              Takes less than a minute — before every new credit transaction
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                n: '1',
                title: 'Search the Party',
                desc: 'Before extending credit to a new buyer, search their company name, GSTIN, or phone number. See all past incidents reported by other vendors in the community.',
              },
              {
                n: '2',
                title: 'Report Your Experience',
                desc: 'If you have been cheated — submit a detailed incident report with evidence. Your report helps protect every other vendor in the network from the same fraudster.',
              },
              {
                n: '3',
                title: 'Make an Informed Decision',
                desc: 'Use verified community intelligence to decide whether to proceed, ask for advance payment, or avoid the party altogether.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="fl-step-circle">{n}</div>
                <h3 style={{ fontWeight: 600, color: '#1E2A24', fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
                  {title}
                </h3>
                <p style={{ color: '#4B6358', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who Is This For ──────────────────────────────────────────────── */}
      <section style={{ background: '#EEF4F0' }} className="section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2
                className="fl-heading"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', color: '#1E2A24', marginBottom: '0.5rem' }}
              >
                Built for India's Food &amp; Spice Trade
              </h2>
              <div className="fl-divider" />
              <p style={{ color: '#4B6358', fontSize: '1.05rem' }}>
                Anyone who extends goods on credit in the food commodity sector can benefit
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  icon: <Shield className="w-5 h-5" style={{ color: '#1C5C3A' }} />,
                  iconBg: '#DCF0E5',
                  title: 'Suppliers & Manufacturers',
                  items: [
                    'Verify a new buyer\'s credibility before giving credit',
                    'Report buyers who defaulted on payment',
                    'Protect your cash flow from serial defaulters',
                  ],
                },
                {
                  icon: <TrendingDown className="w-5 h-5" style={{ color: '#C8973B' }} />,
                  iconBg: '#FBF0DC',
                  title: 'Traders & Brokers',
                  items: [
                    'Check reputation of parties before brokering deals',
                    'Avoid facilitating deals with known fraudsters',
                    'Report when a party uses you to scam suppliers',
                  ],
                },
                {
                  icon: <Users className="w-5 h-5" style={{ color: '#2D3748' }} />,
                  iconBg: '#E8ECF2',
                  title: 'Wholesalers & Distributors',
                  items: [
                    'Screen potential buyers using community intelligence',
                    'Reduce bad debt by acting on early warning signals',
                    'Share payment default patterns across your network',
                  ],
                },
                {
                  icon: <AlertTriangle className="w-5 h-5" style={{ color: '#C8973B' }} />,
                  iconBg: '#FBF0DC',
                  title: 'Industry Coverage',
                  items: [
                    'Spices: turmeric, chili, cumin, pepper, cardamom',
                    'Food grains, pulses, and agri-commodities',
                    'Processed foods, ingredients & FMCG wholesale',
                  ],
                },
              ].map((card, i) => (
                <div key={i} className="fl-card" style={{ background: '#fff' }}>
                  <h3 style={{ fontWeight: 600, color: '#1E2A24', fontSize: '1rem', marginBottom: '1rem', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="fl-icon-box" style={{ background: card.iconBg, width: '2rem', height: '2rem', borderRadius: '0.45rem' }}>
                      {card.icon}
                    </span>
                    {card.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {card.items.map((item, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#4B6358', fontSize: '0.875rem' }}>
                        <span style={{ color: '#2E7D52', marginTop: '0.1rem', flexShrink: 0 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── What's Coming ─────────────────────────────────────────────────── */}
      <section style={{ background: '#fff' }} className="section">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="fl-heading"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', color: '#1E2A24', marginBottom: '0.5rem' }}
            >
              What's Coming Next
            </h2>
            <div className="fl-divider" />
            <p style={{ color: '#4B6358', marginBottom: '2.5rem', fontSize: '1rem' }}>
              FoodLobby is actively expanding its risk management capabilities
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: '📢', title: 'Public Fraud Alerts', desc: 'Broadcast alerts to the entire community when a high-confidence fraud case is confirmed by multiple members.' },
                { icon: '💬', title: 'Community Forum', desc: 'Open discussions for sharing industry experiences, payment dispute advice, and trade knowledge.' },
                { icon: '📱', title: 'WhatsApp Alerts', desc: 'Opt-in alerts when a party you have previously transacted with gets reported by another member.' },
                { icon: '⚖️', title: 'Legal Resource Connect', desc: 'Connect with lawyers and MSME grievance cells who specialise in trade fraud recovery.' },
                { icon: '📊', title: 'Regional Risk Maps', desc: 'Heatmaps showing which districts and trading hubs have the highest reported fraud rates.' },
                { icon: '🏦', title: 'Credit Rating Insights', desc: 'Anonymised aggregate data to help businesses make smarter decisions about payment terms.' },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    background: '#F7F9F7',
                    borderRadius: '0.75rem',
                    padding: '1.1rem 1.25rem',
                    border: '1px solid #D9EDE2',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1E2A24', fontSize: '0.9rem', marginBottom: '0.3rem', fontFamily: "'Inter', sans-serif" }}>{title}</h4>
                    <p style={{ fontSize: '0.825rem', color: '#4B6358', lineHeight: 1.55, marginBottom: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Invite-Only CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(145deg, #0F3D25 0%, #1C5C3A 50%, #1A5035 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="section text-white"
      >
        {/* Dot texture */}
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 text-center relative">

          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo-mark.png"
              alt=""
              style={{ height: '52px', filter: 'brightness(0) invert(1)', opacity: 0.25 }}
            />
          </div>

          <h2
            className="fl-heading text-white"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1rem' }}
          >
            Invite-Only Access
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
            FoodLobby is currently in a pilot phase, open only to verified members of the food &amp; spice trade community.
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '2.5rem', color: 'rgba(255,255,255,0.5)', maxWidth: '540px', margin: '0 auto 2.5rem' }}>
            All members are personally verified to maintain the integrity and trustworthiness of the incident database.
            If you are in the food &amp; spice commodity trade and wish to join, contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <button className="fl-btn-gold">
                Member Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Homepage;
