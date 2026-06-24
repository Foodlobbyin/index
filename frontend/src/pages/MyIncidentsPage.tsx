import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { incidentService, Incident } from '../services/incidentService';
import { invoiceService, Invoice } from '../services/invoiceService';

const statusColors: Record<string, { bg: string; text: string }> = {
  draft:        { bg: 'bg-gray-100',   text: 'text-gray-600'  },
  submitted:    { bg: 'bg-blue-100',   text: 'text-blue-700'  },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved:     { bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:     { bg: 'bg-red-100',    text: 'text-red-700'   },
  resolved:     { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const canEdit   = (s: string) => s === 'draft';
const canDelete = (s: string) => s === 'draft';

const daysSince = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const MyIncidentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Incidents state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incLoading, setIncLoading] = useState(true);
  const [incError, setIncError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Incident | null>(null);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(true);

  const fetchData = async () => {
    setIncLoading(true);
    setInvLoading(true);
    try {
      const [myReports, myInvoices] = await Promise.allSettled([
        incidentService.getModerationQueue().then(() => null).catch(() => null), // dummy
        invoiceService.getInvoices(),
      ]);

      // My reports via dedicated endpoint
      const reportsRes = await fetch('/api/incidents/my-reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setIncidents(d.incidents ?? d);
      }

      if (myInvoices.status === 'fulfilled') {
        setInvoices(myInvoices.value);
      }
    } catch {
      // handled below
    } finally {
      setIncLoading(false);
      setInvLoading(false);
    }
  };

  // Fetch my-reports properly using the incidentService
  useEffect(() => {
    const loadIncidents = async () => {
      setIncLoading(true);
      setIncError(null);
      try {
        // Use the api axios instance (already has auth header)
        const { default: api } = await import('../services/api');
        const res = await api.get('/incidents/my-reports');
        const data = res.data;
        setIncidents(data.incidents ?? data);
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.error ??
          (err as any)?.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to load your submissions.');
        setIncError(msg);
      } finally {
        setIncLoading(false);
      }
    };

    const loadInvoices = async () => {
      setInvLoading(true);
      try {
        const data = await invoiceService.getInvoices();
        setInvoices(data);
      } catch {
        // non-critical — invoices panel just won't show
      } finally {
        setInvLoading(false);
      }
    };

    loadIncidents();
    loadInvoices();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      const { default: api } = await import('../services/api');
      await api.delete(`/incidents/${confirmDelete.id}`);
      setIncidents((prev) => prev.filter((i) => i.id !== confirmDelete.id));
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to delete incident.';
      setIncError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Unpaid invoices: pending or overdue
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'overdue'
  );

  // Use amount_unpaid if set, otherwise fall back to full amount
  const totalUnpaid = unpaidInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount_unpaid ?? inv.amount),
    0
  );

  return (
    <div className="space-y-6">

      {/* ── Unpaid Invoices Summary ── */}
      {!invLoading && unpaidInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Unpaid Invoice Overview</h3>
            <Link
              to="/app/invoices"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              View all invoices →
            </Link>
          </div>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
              <p className="text-xs text-amber-600 font-medium">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{unpaidInvoices.length}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
              <p className="text-xs text-red-600 font-medium">Total Overdue Amount</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                ₹{totalUnpaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Days Unpaid</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unpaidInvoices.map((inv) => {
                  const daysUnpaid = daysSince(inv.due_date);
                  const isOverdue = daysUnpaid > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <Link to={`/app/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        ₹{Number(inv.amount_unpaid ?? inv.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        {inv.amount_unpaid != null && (
                          <span className="block text-xs text-gray-400 font-normal">
                            of ₹{Number(inv.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(inv.due_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2 px-3">
                        {isOverdue ? (
                          <span className="font-semibold text-red-600">{daysUnpaid} days overdue</span>
                        ) : (
                          <span className="text-amber-600">
                            Due in {Math.abs(daysUnpaid)} days
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── My Incident Reports ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Incident Reports</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Incidents you have submitted. Draft reports can be edited or deleted.
            </p>
          </div>
          <Link
            to="/app/incidents/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Report New
          </Link>
        </div>

        {/* Error */}
        {incError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4 flex items-center justify-between">
            <span>{incError}</span>
            <button onClick={() => setIncError(null)} className="ml-3 text-red-400 hover:text-red-600 font-bold">✕</button>
          </div>
        )}

        {incLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading your submissions…</div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-600 font-medium">No incidents submitted yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Report a fraud or issue you encountered with a company.
            </p>
            <Link
              to="/app/incidents/new"
              className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Report First Incident
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Title', 'Company', 'Type', 'Date Reported', 'Status', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incidents.map((incident) => {
                  const colors = statusColors[incident.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
                  const isDeleting = deletingId === incident.id;
                  const editable = canEdit(incident.status);
                  const deletable = canDelete(incident.status);

                  return (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-[220px]">
                        <Link
                          to={`/app/incidents/${incident.id}`}
                          className="text-blue-600 hover:underline line-clamp-2"
                        >
                          {incident.incident_title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <div>{incident.company_name}</div>
                        {incident.company_gstn && (
                          <div className="text-xs text-gray-400 font-mono">{incident.company_gstn}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {incident.incident_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(incident.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {incident.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {incident.status === 'rejected' && incident.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[160px]" title={incident.rejection_reason}>
                            {incident.rejection_reason.length > 40
                              ? incident.rejection_reason.slice(0, 40) + '…'
                              : incident.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/app/incidents/${incident.id}`}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            View
                          </Link>
                          {editable && (
                            <Link
                              to={`/app/incidents/${incident.id}/edit`}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              Edit
                            </Link>
                          )}
                          {deletable && (
                            <button
                              onClick={() => setConfirmDelete(incident)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              {isDeleting ? '…' : 'Delete'}
                            </button>
                          )}
                          {!editable && !deletable && (
                            <span className="text-xs text-gray-400 italic">
                              {incident.status === 'submitted' ? 'Awaiting review' : 'Locked'}
                            </span>
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

      {/* ── Status Guide ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Incident Status Guide</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { status: 'draft', desc: 'Saved but not yet submitted. You can edit or delete.' },
            { status: 'submitted', desc: 'Sent to moderation queue. Awaiting review.' },
            { status: 'under_review', desc: 'A moderator is currently reviewing this incident.' },
            { status: 'approved', desc: 'Verified and publicly visible on the platform.' },
            { status: 'rejected', desc: 'Not approved. Check the reason shown.' },
            { status: 'resolved', desc: 'The issue has been resolved.' },
          ].map(({ status, desc }) => {
            const colors = statusColors[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
            return (
              <div key={status} className="flex items-start gap-2">
                <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
                  {status.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Delete Incident?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium">"{confirmDelete.incident_title}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyIncidentsPage;
