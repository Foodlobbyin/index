import React from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, Shield, FileText, Users, MessageSquare, Star, Eye, TrendingDown } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Homepage: React.FC = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 bg-red-500 bg-opacity-25 border border-red-300 border-opacity-50 rounded-full px-4 py-1 mb-6 text-sm font-medium text-red-100">
              <AlertTriangle size={14} />
              Credit fraud is rising across India's food & spice trade
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Protect Your Business from<br />
              <span className="text-yellow-300">Trade Fraud & Credit Scams</span>
            </h1>

            <p className="text-xl md:text-2xl mb-4 text-green-100 leading-relaxed">
              A community-driven platform for food & spice commodity professionals to report,
              search, and stay protected from buyers who default on payments.
            </p>
            <p className="text-base mb-10 text-green-200">
              Before you extend credit to a new buyer — check if others have already been cheated by them.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 font-bold">
                  Search Incident Reports
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="border-white text-white hover:bg-green-800"
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ────────────────────────────────────────────────── */}
      <section className="bg-red-50 border-b border-red-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
              A common scam pattern in the food trade
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: '1', icon: '🤝', title: 'Trust Building', desc: 'Buyer places small orders, pays on time, builds good rapport with your business over weeks or months.' },
                { step: '2', icon: '📦', title: 'Large Credit Order', desc: 'Once trust is established, buyer requests a large consignment on credit — promising payment within 30–60 days.' },
                { step: '3', icon: '🚪', title: 'Disappears', desc: 'Payment never arrives. Buyer stops responding. Your follow-ups go unanswered. Legal recourse is expensive and slow.' },
                { step: '4', icon: '🔁', title: 'Repeats Elsewhere', desc: 'The same person or company moves on to the next unsuspecting vendor in your industry, repeating the cycle.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="bg-white rounded-xl p-5 border border-red-100 shadow-sm text-center">
                  <div className="text-3xl mb-3">{icon}</div>
                  <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Step {step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Foodlobby Protects You</h2>
            <p className="text-xl text-gray-600">
              Community intelligence tools built specifically for food & spice commodity professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-green-100 rounded-lg mr-4 flex-shrink-0">
                  <Search className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Search Before You Trust</h3>
                  <p className="text-gray-600">
                    Instantly search any company or individual by name, GSTIN, or phone number to see if past incidents have been reported against them by other community members.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-red-100 rounded-lg mr-4 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Report Fraud Incidents</h3>
                  <p className="text-gray-600">
                    Submit detailed incident reports — credit defaults, payment fraud, cheque bounces, or breach of trade agreements — so others in the industry are warned in time.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4 flex-shrink-0">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Reputation Scores</h3>
                  <p className="text-gray-600">
                    Every company profile carries a community-driven reputation score based on verified incident reports, helping you quickly assess the risk of a new trade relationship.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-blue-100 rounded-lg mr-4 flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Invoice & Evidence Logging</h3>
                  <p className="text-gray-600">
                    Attach invoices and payment evidence to your incident reports, creating a timestamped, verifiable record that strengthens the community's case and aids legal action if needed.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-purple-100 rounded-lg mr-4 flex-shrink-0">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Pattern Detection</h3>
                  <p className="text-gray-600">
                    When multiple vendors report the same party, the platform flags them as high-risk, exposing systematic fraudsters who operate across multiple vendors and regions.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-orange-100 rounded-lg mr-4 flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Community Forum <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span></h3>
                  <p className="text-gray-600">
                    A dedicated space for commodity professionals to share fraud alerts, industry experiences, and advice — collectively making the trade ecosystem safer for everyone.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Steps to Stay Protected</h2>
            <p className="text-xl text-gray-600">Takes less than a minute — before every new credit transaction</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Search the Party</h3>
              <p className="text-gray-600">
                Before extending credit to a new buyer, search their company name, GSTIN, or phone number on Foodlobby. See all past incidents reported by other vendors in the community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Report Your Experience</h3>
              <p className="text-gray-600">
                If you have been cheated — submit a detailed incident report with evidence. Your report helps protect every other vendor in the network from the same fraudster.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Make an Informed Decision</h3>
              <p className="text-gray-600">
                Use verified community intelligence to decide whether to proceed with a new trade relationship, ask for advance payment, or avoid the party altogether.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who Is This For ──────────────────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Built for India's Food & Spice Trade
            </h2>
            <p className="text-center text-gray-600 mb-10 text-lg">
              Anyone who extends goods on credit in the food commodity sector can benefit
            </p>
            <div className="grid md:grid-cols-2 gap-6">

              <Card>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-700" /> Suppliers & Manufacturers
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Verify a new buyer's credibility before giving credit
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Report buyers who defaulted on payment
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Protect your cash flow from serial defaulters
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" /> Traders & Brokers
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Check reputation of parties before brokering deals
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Avoid facilitating deals with known fraudsters
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Report when a party uses you to scam suppliers
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Wholesalers & Distributors
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Screen potential buyers using community intelligence
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Reduce bad debt by acting on early warning signals
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Share payment default patterns across your network
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" /> Industry Coverage
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Spices: turmeric, chili, cumin, pepper, cardamom
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Food grains, pulses, and agri-commodities
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    Processed foods, ingredients & FMCG wholesale
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Future Roadmap ───────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">What's Coming Next</h2>
            <p className="text-gray-600 mb-8">
              Foodlobby is actively expanding its risk management capabilities
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: '📢', title: 'Public Fraud Alerts', desc: 'Broadcast alerts to the entire community when a high-confidence fraud case is confirmed by multiple members.' },
                { icon: '💬', title: 'Community Forum', desc: 'Open discussions for sharing industry experiences, payment dispute advice, and trade knowledge.' },
                { icon: '📱', title: 'WhatsApp Alerts', desc: 'Opt-in alerts to your phone when a party you have previously transacted with gets reported by another member.' },
                { icon: '⚖️', title: 'Legal Resource Connect', desc: 'Connect with lawyers and MSME grievance cells who specialise in trade fraud recovery for small businesses.' },
                { icon: '📊', title: 'Regional Risk Maps', desc: 'Heatmaps showing which districts and trading hubs have the highest reported fraud rates in the food commodity sector.' },
                { icon: '🏦', title: 'Credit Rating Insights', desc: 'Anonymised aggregate data to help businesses make smarter decisions about payment terms with unknown buyers.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Invite-Only Notice ───────────────────────────────────────────────── */}
      <section className="section bg-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Invite-Only Access</h2>
          <p className="text-xl mb-4 text-green-100">
            Foodlobby is currently in a pilot phase, open only to verified members of the food & spice trade community.
          </p>
          <p className="text-base mb-8 text-green-200">
            All members are personally verified to maintain the integrity and trustworthiness of the incident database.
            If you are in the food & spice commodity trade and wish to join, contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 font-bold">
                Member Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Homepage;
