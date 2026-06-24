import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { incidentService, Incident } from '../services/incidentService';

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft:        { label: 'Draft',        bg: 'bg-gray-100',    text: 'text-gray-700',   border: 'border-gray-200' },
  submitted:    { label: 'Submitted',    bg: 'bg-blue-100',    text: 'text-blue-700',   border: 'border-blue-200' },
  under_review: { label: 'Under Review', bg: 'bg-yellow-100',  text: 'text-yellow-800', border: 'border-yellow-200' },
  approved:     { label: 'Approved',     bg: 'bg-green-100',   text: 'text-green-700',  border: 'border-green-200' },
  rejected:     { label: 'Rejected',     bg: 'bg-red-100',     text: 'text-red-700',    border: 'border-red-200' },
  resolved:     { label: 'Resolved',     bg: 'bg-purple-100',  text: 'text-purple-700', border: 'border-purple-200' },
};

const typeLabels: Record<string, string> = {
  FRAUD: 'Fraud', QUALITY_ISSUE: 'Quality Issue', SERVICE_ISSUE: 'Service Issue',
  PAYMENT_ISSUE: 'Payment Issue', CONTRACT_BREACH: 'Contract Breach', OTHER: 'Other',
};

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number | null | undefined, currency = 'INR'): string {
  if (amount == null) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // isReporter: check reporter_id match regardless of anonymity
  // (The reporter themselves can see their own submission even if anonymous to others)
  const isReporter = !!user && !!incident && incident.reporter_id === user.id;

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) { setError('Invalid incident ID.'); setLoading(false); return; }
    incidentService.getById(numId)
      .then(setIncident)
      .catch((err: unknown) => {
        setError(
          (err as any)?.response?.data?.error ??
          (err as any)?.response?.data?.message ??
          'Failed to load incident.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!incident) return;
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    try {
      await incidentService.remove(incident.id);
      navigate('/app/my-incidents');
    } catch (err: unknown) {
      alert((err as any)?.response?.data?.error ?? 'Failed to delete.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading incident…</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <p className="text-red-600 text-sm">{error ?? 'Incident not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">← Go back</button>
      </div>
    );
  }

  const status = statusConfig[incident.status] ?? statusConfig['draft'];
  const incidentInvoices = (incident as any).incident_invoices ?? [];
  const contactPersons = (incident as any).contact_persons ?? [];

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between pt-1">
        <Link to="/app/my-incidents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Reports
        </Link>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${status.bg} ${status.text}`}>
          {status.label.toUpperCase()}
        </span>
      </div>

      {/* ── Company + Incident Header ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Incident Report</p>
          <h1 className="text-xl font-bold text-white leading-snug">{incident.company_name}</h1>
          {incident.company_gstn && (
            <p className="text-xs text-slate-300 font-mono mt-1">GSTIN: {incident.company_gstn}</p>
          )}
        </div>

        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Incident Type</p>
            <p className="text-sm font-semibold text-gray-900">{typeLabels[incident.incident_type] ?? incident.incident_type.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Date Reported</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(incident.incident_date ?? incident.created_at)}</p>
          </div>
          {incident.amount_involved != null && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Total Amount Involved</p>
              <p className="text-sm font-bold text-red-600">{formatAmount(incident.amount_involved, incident.currency_code ?? 'INR')}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Submission Date</p>
            <p className="text-sm text-gray-700">{new Date(incident.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Reporter</p>
            <p className="text-sm text-gray-500 italic">Anonymous</p>
          </div>
          {incident.company_gstn && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">State (from GSTIN)</p>
              <p className="text-sm text-gray-700">{incident.state ?? '—'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {incident.description && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{incident.description}</p>
        </div>
      )}

      {/* ── Invoices ── */}
      {incidentInvoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Invoices in this Incident</p>
              <p className="text-xs text-gray-400 mt-0.5">{incidentInvoices.length} invoice{incidentInvoices.length !== 1 ? 's' : ''} reported</p>
            </div>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
              {incidentInvoices.length} unpaid
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['#', 'Invoice Date', 'Due Date', 'Invoice Amount', 'Unpaid Amount', 'Item / Product'].map(col => (
                    <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {incidentInvoices.map((inv: any, idx: number) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatAmount(inv.invoice_amount, inv.currency_code)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-red-600">{formatAmount(inv.unpaid_amount, inv.currency_code)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.item_sold || <span className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Contact Persons ── */}
      {contactPersons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
          <p className="text-sm font-semibold text-gray-900 mb-1">Contact Persons at Reported Company</p>
          <p className="text-xs text-gray-400 mb-4">Individuals identified at this company in connection with this incident.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contactPersons.map((cp: any) => (
              <div key={cp.id} className="flex items-start gap-3 border border-gray-100 rounded-xl p-3.5 bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-600">{cp.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{cp.name}</p>
                  {cp.position && <p className="text-xs text-gray-500">{cp.position}</p>}
                  {cp.phone && <p className="text-xs text-gray-600 mt-1">📞 {cp.phone}</p>}
                  {cp.email && <p className="text-xs text-gray-500 truncate">{cp.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Moderator/Rejection Notes (read-only display only) ── */}
      {incident.moderator_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Moderator Notes</p>
          <p className="text-sm text-blue-800">{incident.moderator_notes}</p>
        </div>
      )}
      {incident.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Rejection Reason</p>
          <p className="text-sm text-red-800">{incident.rejection_reason}</p>
        </div>
      )}

      {/* ── Reporter Actions (Draft only) ── */}
      {isReporter && incident.status === 'draft' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center gap-3">
          <p className="text-sm text-gray-500 flex-1">This incident is still a draft.</p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* ── Status info for non-draft ── */}
      {incident.status === 'submitted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4">
          <p className="text-sm text-blue-700 font-medium">This report has been submitted and is awaiting moderation review.</p>
        </div>
      )}
      {incident.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
          <p className="text-sm text-green-700 font-medium">This report has been verified and is publicly visible on the platform.</p>
        </div>
      )}

    </div>
  );
};

export default IncidentDetailPage;
