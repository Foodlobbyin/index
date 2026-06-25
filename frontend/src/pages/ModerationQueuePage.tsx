import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MODERATOR_LEVELS = ['moderator', 'admin'] as const;

const typeLabels: Record<string, string> = {
  FRAUD: 'Fraud', QUALITY_ISSUE: 'Quality Issue', SERVICE_ISSUE: 'Service Issue',
  PAYMENT_ISSUE: 'Payment Issue', CONTRACT_BREACH: 'Contract Breach', OTHER: 'Other',
};

function fmt(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmt(n: number | null | undefined, cur = 'INR') {
  if (n == null) return '—';
  return `${cur} ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Diff helper: returns array of field rows with old/new
function diffFields(edit: any) {
  const fields = [
    { label: 'Company Name',    old: edit.old_company_name,         new: edit.new_company_name },
    { label: 'GSTIN',           old: edit.old_company_gstn,         new: edit.new_company_gstn },
    { label: 'State',           old: edit.old_state,                new: edit.new_state },
    { label: 'Pincode',         old: edit.old_pincode,              new: edit.new_pincode },
    { label: 'Street Address',  old: edit.old_street_address,       new: edit.new_street_address },
    { label: 'MSME No.',        old: edit.old_msme_udyam_number,    new: edit.new_msme_udyam_number },
    { label: 'Incident Type',   old: typeLabels[edit.old_incident_type] ?? edit.old_incident_type, new: typeLabels[edit.new_incident_type] ?? edit.new_incident_type },
    { label: 'Incident Date',   old: fmt(edit.old_incident_date),   new: fmt(edit.new_incident_date) },
    { label: 'Title',           old: edit.old_incident_title,       new: edit.new_incident_title },
    { label: 'Description',     old: edit.old_description,          new: edit.new_description },
    { label: 'Amount Involved', old: fmtAmt(edit.old_amount_involved, edit.old_currency_code), new: fmtAmt(edit.new_amount_involved, edit.new_currency_code) },
    { label: 'Currency',        old: edit.old_currency_code,        new: edit.new_currency_code },
  ];
  return fields.filter(f => (f.old ?? '') !== (f.new ?? ''));
}

const ModerationQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'incidents' | 'edits'>('incidents');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rejectInput, setRejectInput] = useState<Record<number, string>>({});
  const [rejectOpen, setRejectOpen] = useState<number | null>(null);
  const [actionState, setActionState] = useState<Record<string, 'loading' | null>>({});

  const isModerator = !!user?.trust_level && MODERATOR_LEVELS.includes(user.trust_level as any);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/moderation/queue');
      setIncidents(res.data.incidents ?? []);
      setPendingEdits(res.data.pending_edits ?? []);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Failed to load queue.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isModerator) fetchQueue(); }, [isModerator]);

  if (!isModerator) return <Navigate to="/app" replace />;

  const setAction = (key: string, val: 'loading' | null) =>
    setActionState(p => val === null ? (({ [key]: _, ...rest }) => rest)(p) : { ...p, [key]: val });

  const handleApproveIncident = async (id: number) => {
    setAction(`inc-${id}`, 'loading');
    try {
      await api.put(`/moderation/incidents/${id}/approve`, {});
      setIncidents(p => p.filter(i => i.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err: any) { setError(err?.response?.data?.error ?? 'Failed to approve.'); }
    finally { setAction(`inc-${id}`, null); }
  };

  const handleRejectIncident = async (id: number) => {
    const reason = rejectInput[id]?.trim();
    if (!reason) { setError('Rejection reason is required.'); return; }
    setAction(`inc-${id}-rej`, 'loading');
    try {
      await api.put(`/moderation/incidents/${id}/reject`, { reason });
      setIncidents(p => p.filter(i => i.id !== id));
      if (expanded === id) setExpanded(null);
      setRejectOpen(null);
    } catch (err: any) { setError(err?.response?.data?.error ?? 'Failed to reject.'); }
    finally { setAction(`inc-${id}-rej`, null); }
  };

  const handleApproveEdit = async (editId: number) => {
    setAction(`edit-${editId}`, 'loading');
    try {
      await api.put(`/pending-edits/${editId}/approve`, {});
      setPendingEdits(p => p.filter(e => e.id !== editId));
      if (expanded === editId + 100000) setExpanded(null);
    } catch (err: any) { setError(err?.response?.data?.error ?? 'Failed to approve edit.'); }
    finally { setAction(`edit-${editId}`, null); }
  };

  const handleRejectEdit = async (editId: number) => {
    const reason = rejectInput[editId + 100000]?.trim();
    if (!reason) { setError('Rejection reason is required.'); return; }
    setAction(`edit-${editId}-rej`, 'loading');
    try {
      await api.put(`/pending-edits/${editId}/reject`, { reason });
      setPendingEdits(p => p.filter(e => e.id !== editId));
      if (expanded === editId + 100000) setExpanded(null);
      setRejectOpen(null);
    } catch (err: any) { setError(err?.response?.data?.error ?? 'Failed to reject edit.'); }
    finally { setAction(`edit-${editId}-rej`, null); }
  };

  const tbtn = (active: boolean) =>
    `px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 bg-gray-50'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Moderation Queue</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} · {pendingEdits.length} pending edit{pendingEdits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={fetchQueue} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        <button className={tbtn(tab === 'incidents')} onClick={() => setTab('incidents')}>
          New Incidents {incidents.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{incidents.length}</span>}
        </button>
        <button className={tbtn(tab === 'edits')} onClick={() => setTab('edits')}>
          Pending Edits {pendingEdits.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">{pendingEdits.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading queue…</p>
        </div>
      ) : (
        <>
          {/* ── NEW INCIDENTS TAB ── */}
          {tab === 'incidents' && (
            incidents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-sm text-gray-400">No incidents pending review.</div>
            ) : (
              <div className="space-y-3">
                {incidents.map(inc => {
                  const isOpen = expanded === inc.id;
                  const invs: any[] = inc.incident_invoices ?? [];
                  const cps: any[] = inc.contact_persons ?? [];
                  const busy = !!actionState[`inc-${inc.id}`] || !!actionState[`inc-${inc.id}-rej`];
                  return (
                    <div key={inc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Row header */}
                      <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        onClick={() => setExpanded(isOpen ? null : inc.id)}>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{inc.company_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {typeLabels[inc.incident_type] ?? inc.incident_type}
                              {inc.company_gstn && ` · GSTIN: ${inc.company_gstn}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${inc.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}`}>
                            {inc.status.replace(/_/g,' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(inc.created_at).toLocaleDateString('en-IN')}</span>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                          {/* Core fields */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                              ['Company Name', inc.company_name],
                              ['GSTIN', inc.company_gstn || '—'],
                              ['State', inc.state || '—'],
                              ['Pincode', inc.pincode || '—'],
                              ['Street Address', inc.street_address || '—'],
                              ['MSME No.', inc.msme_udyam_number || '—'],
                              ['Incident Type', typeLabels[inc.incident_type] ?? inc.incident_type],
                              ['Amount Involved', fmtAmt(inc.amount_involved, inc.currency_code)],
                              ['Date', fmt(inc.incident_date)],
                            ].map(([l,v]) => (
                              <div key={l as string}>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{l}</p>
                                <p className="text-sm text-gray-800 mt-0.5">{v}</p>
                              </div>
                            ))}
                          </div>

                          {/* Description */}
                          {inc.description && (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{inc.description}</p>
                            </div>
                          )}

                          {/* Invoices */}
                          {invs.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Invoices ({invs.length})</p>
                              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50">
                                    {['#','Invoice Date','Due Date','Invoice Amt','Unpaid Amt','Item'].map(h => (
                                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr></thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {invs.map((inv: any, i: number) => (
                                      <tr key={inv.id}>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{i+1}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmt(inv.invoice_date)}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmt(inv.due_date)}</td>
                                        <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">{fmtAmt(inv.invoice_amount, inv.currency_code)}</td>
                                        <td className="px-3 py-2 font-bold text-red-600 whitespace-nowrap">{fmtAmt(inv.unpaid_amount, inv.currency_code)}</td>
                                        <td className="px-3 py-2 text-gray-600">{inv.item_sold || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Contacts */}
                          {cps.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact Persons ({cps.length})</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cps.map((cp: any) => (
                                  <div key={cp.id} className="flex items-start gap-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-slate-600">{cp.name?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{cp.name}</p>
                                      {cp.position && <p className="text-xs text-gray-500">{cp.position}</p>}
                                      {cp.phone && <p className="text-xs text-gray-600 mt-0.5">📞 {cp.phone}</p>}
                                      {cp.email && <p className="text-xs text-gray-500">{cp.email}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="border-t border-gray-100 pt-4 space-y-3">
                            {rejectOpen === inc.id && (
                              <div className="flex gap-2">
                                <input type="text" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                  placeholder="Enter rejection reason…"
                                  value={rejectInput[inc.id] ?? ''}
                                  onChange={e => setRejectInput(p => ({...p, [inc.id]: e.target.value}))} />
                                <button onClick={() => handleRejectIncident(inc.id)} disabled={busy}
                                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                  {actionState[`inc-${inc.id}-rej`] ? 'Rejecting…' : 'Confirm Reject'}
                                </button>
                                <button onClick={() => setRejectOpen(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <button onClick={() => handleApproveIncident(inc.id)} disabled={busy}
                                className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                                {actionState[`inc-${inc.id}`] ? 'Approving…' : 'Approve'}
                              </button>
                              <button onClick={() => { setRejectOpen(inc.id); setExpanded(inc.id); }} disabled={busy}
                                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── PENDING EDITS TAB ── */}
          {tab === 'edits' && (
            pendingEdits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-sm text-gray-400">No pending edits awaiting review.</div>
            ) : (
              <div className="space-y-3">
                {pendingEdits.map(edit => {
                  const expandKey = edit.id + 100000;
                  const isOpen = expanded === expandKey;
                  const changedFields = diffFields(edit);
                  const oldInvoices = Array.isArray(edit.old_invoices) ? edit.old_invoices : JSON.parse(edit.old_invoices || '[]');
                  const newInvoices = Array.isArray(edit.new_invoices) ? edit.new_invoices : JSON.parse(edit.new_invoices || '[]');
                  const oldContacts = Array.isArray(edit.old_contacts) ? edit.old_contacts : JSON.parse(edit.old_contacts || '[]');
                  const newContacts = Array.isArray(edit.new_contacts) ? edit.new_contacts : JSON.parse(edit.new_contacts || '[]');
                  const busy = !!actionState[`edit-${edit.id}`] || !!actionState[`edit-${edit.id}-rej`];

                  return (
                    <div key={edit.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                      <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-amber-50 transition-colors text-left"
                        onClick={() => setExpanded(isOpen ? null : expandKey)}>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Edit Request</span>
                            <span className="text-xs text-gray-400">{new Date(edit.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{edit.current_company_name ?? edit.new_company_name}</p>
                          <p className="text-xs text-gray-400">{changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed · Original incident #{edit.incident_id}</p>
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="border-t border-amber-100 px-6 py-5 space-y-5">
                          {/* Changed fields diff */}
                          {changedFields.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Changed Fields</p>
                              <div className="space-y-2">
                                {changedFields.map(f => (
                                  <div key={f.label} className="grid grid-cols-3 gap-3 text-sm items-start border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide self-stretch flex items-center">{f.label}</div>
                                    <div className="px-3 py-2 bg-red-50 border-l border-red-100">
                                      <span className="text-xs font-semibold text-red-400 uppercase block mb-0.5">Before</span>
                                      <p className="text-sm text-red-800 whitespace-pre-wrap">{f.old || <span className="text-gray-300 italic">empty</span>}</p>
                                    </div>
                                    <div className="px-3 py-2 bg-green-50 border-l border-green-100">
                                      <span className="text-xs font-semibold text-green-500 uppercase block mb-0.5">After</span>
                                      <p className="text-sm text-green-800 whitespace-pre-wrap">{f.new || <span className="text-gray-300 italic">empty</span>}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Invoice diff */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Invoices Comparison</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-semibold text-red-500 uppercase mb-1">Before ({oldInvoices.length})</p>
                                {oldInvoices.length === 0 ? <p className="text-xs text-gray-400 italic">None</p> : oldInvoices.map((inv: any, i: number) => (
                                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-2 mb-1 text-xs">
                                    <p>Amt: {fmtAmt(inv.invoice_amount, inv.currency_code)} · Unpaid: {fmtAmt(inv.unpaid_amount, inv.currency_code)}</p>
                                    <p className="text-gray-500">{fmt(inv.invoice_date)} → {fmt(inv.due_date)}</p>
                                    {inv.item_sold && <p className="text-gray-500">{inv.item_sold}</p>}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase mb-1">After ({newInvoices.length})</p>
                                {newInvoices.length === 0 ? <p className="text-xs text-gray-400 italic">None</p> : newInvoices.map((inv: any, i: number) => (
                                  <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-2 mb-1 text-xs">
                                    <p>Amt: {fmtAmt(inv.invoice_amount, inv.currency_code)} · Unpaid: {fmtAmt(inv.unpaid_amount, inv.currency_code)}</p>
                                    <p className="text-gray-500">{fmt(inv.invoice_date)} → {fmt(inv.due_date)}</p>
                                    {inv.item_sold && <p className="text-gray-500">{inv.item_sold}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Contacts diff */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Contacts Comparison</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-semibold text-red-500 uppercase mb-1">Before ({oldContacts.length})</p>
                                {oldContacts.length === 0 ? <p className="text-xs text-gray-400 italic">None</p> : oldContacts.map((cp: any, i: number) => (
                                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-2 mb-1 text-xs">
                                    <p className="font-semibold">{cp.name}</p>
                                    {cp.position && <p className="text-gray-500">{cp.position}</p>}
                                    {cp.phone && <p>📞 {cp.phone}</p>}
                                    {cp.email && <p>{cp.email}</p>}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase mb-1">After ({newContacts.length})</p>
                                {newContacts.length === 0 ? <p className="text-xs text-gray-400 italic">None</p> : newContacts.map((cp: any, i: number) => (
                                  <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-2 mb-1 text-xs">
                                    <p className="font-semibold">{cp.name}</p>
                                    {cp.position && <p className="text-gray-500">{cp.position}</p>}
                                    {cp.phone && <p>📞 {cp.phone}</p>}
                                    {cp.email && <p>{cp.email}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="border-t border-gray-100 pt-4 space-y-3">
                            {rejectOpen === expandKey && (
                              <div className="flex gap-2">
                                <input type="text" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                  placeholder="Enter rejection reason…"
                                  value={rejectInput[expandKey] ?? ''}
                                  onChange={e => setRejectInput(p => ({...p, [expandKey]: e.target.value}))} />
                                <button onClick={() => handleRejectEdit(edit.id)} disabled={busy}
                                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                  {actionState[`edit-${edit.id}-rej`] ? 'Rejecting…' : 'Confirm Reject'}
                                </button>
                                <button onClick={() => setRejectOpen(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <button onClick={() => handleApproveEdit(edit.id)} disabled={busy}
                                className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                                {actionState[`edit-${edit.id}`] ? 'Approving…' : 'Approve Edit'}
                              </button>
                              <button onClick={() => { setRejectOpen(expandKey); setExpanded(expandKey); }} disabled={busy}
                                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                Reject Edit
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 italic">Rejecting preserves original incident data unchanged.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ModerationQueuePage;
