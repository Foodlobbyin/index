/**
 * MyDefaultsPage — Company Response Portal
 *
 * Shown to users whose registered company has had an incident filed against it.
 * Always visible to admin for pilot testing.
 *
 * Purpose: Let the accused company view each incident/invoice filed against
 * them, select categories explaining the default, and submit their remark.
 * No add/delete invoice actions — read-only on invoice data.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';

// ── Default-reason categories ────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  description: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'quality_issue',
    label: 'Quality Issue',
    description: 'Goods received were substandard, damaged, or did not match specifications.',
  },
  {
    id: 'short_delivery',
    label: 'Short / Wrong Delivery',
    description: 'Quantity delivered was less than ordered, or wrong goods were sent.',
  },
  {
    id: 'rate_dispute',
    label: 'Rate / Price Dispute',
    description: 'Final invoice rate differs from the mutually agreed rate or purchase order.',
  },
  {
    id: 'commitment_breach',
    label: 'Commitment / Delivery Breach',
    description: 'Supplier did not honour agreed delivery dates, schedules, or terms.',
  },
  {
    id: 'documentation_incomplete',
    label: 'Incomplete / Incorrect Documentation',
    description: 'Missing or erroneous invoice, E-way bill, GST invoice, or other docs.',
  },
  {
    id: 'financial_hardship',
    label: 'Financial Hardship / Cash Flow',
    description: 'Temporary liquidity or cash-flow issue on our side; payment is intended.',
  },
  {
    id: 'legal_dispute',
    label: 'Under Legal Dispute / Arbitration',
    description: 'This transaction is subject to an ongoing legal dispute or arbitration.',
  },
  {
    id: 'already_paid',
    label: 'Already Paid — Proof Available',
    description: 'Payment has already been made; reconciliation or proof can be shared.',
  },
  {
    id: 'force_majeure',
    label: 'Force Majeure',
    description: 'Unforeseeable event (natural calamity, pandemic, government order) caused the delay.',
  },
  {
    id: 'mutual_negotiation',
    label: 'Mutual Negotiation Pending',
    description: 'Both parties are in active negotiation — settlement is being worked out.',
  },
  {
    id: 'deduction_claim',
    label: 'Deduction / Claim Against Supplier',
    description: 'Amount withheld as a deduction or claim for damages, penalties, or short supply.',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Reason not listed above — please describe in the remark field.',
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: number;
  incident_id: number;
  invoice_number: string;
  amount: string | number;
  amount_unpaid?: string | number | null;
  issue_date: string;
  due_date: string;
  status: string;
  category?: string;
  item_sold?: string;
  description?: string;
}

interface MyResponse {
  id: number;
  incident_id: number;
  response_text: string;
  default_categories: string[];
  responded_at: string;
}

interface IncidentItem {
  id: number;
  company_gstn: string;
  company_name: string;
  incident_type: string;
  incident_date?: string;
  incident_title: string;
  description: string;
  amount_involved?: string | number | null;
  currency_code: string;
  status: string;
  created_at: string;
  invoices: InvoiceItem[];
  my_response: MyResponse | null;
}

// ── Status badge helper ──────────────────────────────────────────────────────

const statusBadge: Record<string, { bg: string; text: string }> = {
  submitted:    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved:     { bg: 'bg-green-100',  text: 'text-green-700'  },
  resolved:     { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const fmt = (n: string | number | null | undefined) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

// ── Sub-component: ResponsePanel ─────────────────────────────────────────────

interface ResponsePanelProps {
  incident: IncidentItem;
  gstn: string;
  onResponseSaved: (incidentId: number, response: MyResponse) => void;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({ incident, gstn, onResponseSaved }) => {
  const existing = incident.my_response;

  const [editing, setEditing] = useState(!existing);
  const [selectedCats, setSelectedCats] = useState<string[]>(existing?.default_categories ?? []);
  const [remark, setRemark] = useState(existing?.response_text ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!remark.trim()) { setError('Please enter a remark before submitting.'); return; }
    if (selectedCats.length === 0) { setError('Please select at least one category.'); return; }
    setError(null);
    setSaving(true);
    try {
      const { default: api } = await import('../services/api');
      const res = await api.post(`/incidents/${incident.id}/respond`, {
        responder_gstn: gstn,
        response_text: remark.trim(),
        default_categories: selectedCats,
      });
      const saved: MyResponse = res.data.response;
      onResponseSaved(incident.id, saved);
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to submit response.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Existing response display ──
  if (!editing && existing) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
            <CheckCircle2 size={16} />
            Your response was submitted
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Update response
          </button>
        </div>

        {existing.default_categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existing.default_categories.map((catId) => {
              const cat = DEFAULT_CATEGORIES.find((c) => c.id === catId);
              return cat ? (
                <span key={catId} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {cat.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {existing.response_text}
        </p>
        <p className="text-xs text-gray-400">
          Submitted on {new Date(existing.responded_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
    );
  }

  // ── Response form ──
  return (
    <div className="mt-4 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
      <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
        <MessageSquare size={16} />
        {existing ? 'Update your response' : 'Submit your response'}
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Category checklist */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Why was the payment stopped? (select all that apply)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEFAULT_CATEGORIES.map((cat) => {
            const checked = selectedCats.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCat(cat.id)}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                  checked
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {checked
                    ? <CheckSquare size={16} className="text-blue-600" />
                    : <Square size={16} className="text-gray-400" />
                  }
                </span>
                <span>
                  <span className={`block text-xs font-semibold ${checked ? 'text-blue-800' : 'text-gray-700'}`}>
                    {cat.label}
                  </span>
                  <span className="block text-xs text-gray-500 leading-snug mt-0.5">
                    {cat.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Remark textarea */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
          Your Remark *
        </label>
        <textarea
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Provide your side of the story — include any relevant facts, dates, or agreements that support your position."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical bg-white"
          disabled={saving}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Submitting…' : 'Submit Response'}
        </button>
        {existing && (
          <button
            onClick={() => { setEditing(false); setSelectedCats(existing.default_categories); setRemark(existing.response_text); setError(null); }}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// ── Sub-component: IncidentCard ───────────────────────────────────────────────

interface IncidentCardProps {
  incident: IncidentItem;
  gstn: string;
  onResponseSaved: (incidentId: number, response: MyResponse) => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, gstn, onResponseSaved }) => {
  const [expanded, setExpanded] = useState(false);
  const badge = statusBadge[incident.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header row — always visible */}
      <button
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {incident.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 font-mono">#{incident.id}</span>
            {incident.my_response && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 size={12} /> Responded
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{incident.incident_title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {incident.incident_type.replace(/_/g, ' ')}
            </span>
            {incident.amount_involved && (
              <span className="font-medium text-red-600">
                {fmt(incident.amount_involved)} {incident.currency_code}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(incident.created_at).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-gray-400 mt-0.5">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">

          {/* Incident description */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Complaint Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{incident.description}</p>
          </div>

          {/* Invoices table */}
          {incident.invoices.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Invoices Cited ({incident.invoices.length})
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Invoice #', 'Amount', 'Unpaid', 'Issue Date', 'Due Date', 'Item'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {incident.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-3 py-2 font-mono text-xs text-gray-800">{inv.invoice_number}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{fmt(inv.amount)}</td>
                        <td className="px-3 py-2 font-medium text-red-600">{fmt(inv.amount_unpaid)}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{inv.item_sold || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Info size={12} />
                These invoice details were submitted by the complainant. You cannot edit them.
              </p>
            </div>
          )}

          {/* Response panel */}
          <ResponsePanel incident={incident} gstn={gstn} onResponseSaved={onResponseSaved} />
        </div>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const MyDefaultsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [gstn, setGstn] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { default: api } = await import('../services/api');
        const res = await api.get('/incidents/against-my-company');
        const data = res.data;
        setIncidents(data.incidents ?? []);
        setGstn(data.gstn ?? '');
        setCompanyName(data.company_name ?? '');
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.error ??
          (err as any)?.response?.data?.message ??
          'Failed to load incident data.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleResponseSaved = (incidentId: number, response: MyResponse) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId ? { ...inc, my_response: response } : inc
      )
    );
  };

  const respondedCount = incidents.filter((i) => i.my_response).length;
  const pendingCount = incidents.length - respondedCount;

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Defaults</h1>
            {companyName && (
              <p className="text-sm text-gray-500 mt-0.5">
                Incidents filed against <span className="font-medium text-gray-700">{companyName}</span>
                {gstn && <span className="font-mono text-xs text-gray-400 ml-2">({gstn})</span>}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Review complaints filed against your company and submit your remark for each.
            </p>
          </div>
        </div>

        {/* Summary chips */}
        {!loading && incidents.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center min-w-[100px]">
              <p className="text-xs text-gray-500">Total Incidents</p>
              <p className="text-xl font-bold text-gray-900">{incidents.length}</p>
            </div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-center min-w-[100px]">
              <p className="text-xs text-amber-600">Awaiting Response</p>
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            </div>
            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-center min-w-[100px]">
              <p className="text-xs text-green-600">Responded</p>
              <p className="text-xl font-bold text-green-700">{respondedCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── How it works banner ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">How My Defaults works</p>
          <p>
            Each card below is a complaint filed against your company. Expand a card to see the
            invoice details provided by the complainant (read-only), then select the categories
            that best explain your side and add a remark. Your response will be visible to
            moderators and may be shown alongside the complaint.
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Loading incidents…
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && incidents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-700 font-medium">No incidents filed against your company</p>
          <p className="text-gray-400 text-sm mt-1">
            This page will show incidents once a complaint is submitted against your company.
          </p>
        </div>
      )}

      {/* ── Incident cards ── */}
      {!loading && incidents.length > 0 && (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              gstn={gstn}
              onResponseSaved={handleResponseSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDefaultsPage;
