import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { incidentService, Incident, IncidentType } from '../services/incidentService';
import api from '../services/api';

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'CONTRACT_BREACH', label: 'Contract Breach' },
  { value: 'OTHER', label: 'Other' },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

interface InvoiceRow {
  id?: number;
  invoice_number: string;
  invoice_amount: string;
  unpaid_amount: string;
  invoice_date: string;
  due_date: string;
  item_sold: string;
  currency_code: string;
}

interface ContactRow {
  id?: number;
  name: string;
  position: string;
  email: string;
  phone: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft:        { label: 'Draft',        bg: 'bg-gray-100',   text: 'text-gray-700'   },
  submitted:    { label: 'Submitted',    bg: 'bg-blue-100',   text: 'text-blue-700'   },
  under_review: { label: 'Under Review', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved:     { label: 'Approved',     bg: 'bg-green-100',  text: 'text-green-700'  },
  rejected:     { label: 'Rejected',     bg: 'bg-red-100',    text: 'text-red-700'    },
  resolved:     { label: 'Resolved',     bg: 'bg-purple-100', text: 'text-purple-700' },
};

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

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

export default function IncidentDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasPendingEdit, setHasPendingEdit] = useState(false);

  // Edit form state
  const [editCompany, setEditCompany] = useState({
    company_gstn: '', company_name: '', state: '', pincode: '',
    street_address: '', msme_udyam_number: '',
  });
  const [editIncident, setEditIncident] = useState({
    incident_type: 'PAYMENT_ISSUE' as IncidentType,
    description: '', currency_code: 'INR',
  });
  const [editInvoices, setEditInvoices] = useState<InvoiceRow[]>([]);
  const [editContacts, setEditContacts] = useState<ContactRow[]>([]);

  // Lookup states
  const [gstnStatus, setGstnStatus] = useState<'idle'|'loading'|'found'|'not_found'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<Record<number,'idle'|'loading'|'found'|'not_found'>>({});

  const isReporter = !!user && !!incident && incident.reporter_id === user.id;

  const loadIncident = useCallback(async () => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) { setError('Invalid incident ID.'); setLoading(false); return; }
    try {
      const data = await incidentService.getById(numId);
      setIncident(data);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Failed to load incident.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadIncident(); }, [loadIncident]);

  // Check for pending edit
  useEffect(() => {
    if (!incident || !user) return;
    api.get('/pending-edits/my').then(res => {
      const edits = res.data?.pending_edits ?? [];
      const hasPending = edits.some((e: any) => e.incident_id === incident.id && e.status === 'pending');
      setHasPendingEdit(hasPending);
    }).catch(() => {});
  }, [incident, user]);

  const startEdit = () => {
    if (!incident) return;
    const invs: any[] = (incident as any).incident_invoices ?? [];
    const cps: any[] = (incident as any).contact_persons ?? [];
    setEditCompany({
      company_gstn: incident.company_gstn ?? '',
      company_name: incident.company_name ?? '',
      state: (incident as any).state ?? '',
      pincode: (incident as any).pincode ?? '',
      street_address: (incident as any).street_address ?? '',
      msme_udyam_number: (incident as any).msme_udyam_number ?? '',
    });
    setEditIncident({
      incident_type: incident.incident_type,
      description: incident.description ?? '',
      currency_code: incident.currency_code ?? 'INR',
    });
    setEditInvoices(invs.map(i => ({
      id: i.id,
      invoice_number: i.invoice_number ?? '',
      invoice_amount: i.invoice_amount?.toString() ?? '',
      unpaid_amount: i.unpaid_amount?.toString() ?? '',
      invoice_date: i.invoice_date ? i.invoice_date.split('T')[0] : '',
      due_date: i.due_date ? i.due_date.split('T')[0] : '',
      item_sold: i.item_sold ?? '',
      currency_code: i.currency_code ?? 'INR',
    })));
    if (editInvoices.length === 0 && invs.length === 0) {
      setEditInvoices([{ invoice_number:'', invoice_amount:'', unpaid_amount:'', invoice_date:'', due_date:'', item_sold:'', currency_code:'INR' }]);
    }
    setEditContacts(cps.map(c => ({
      id: c.id,
      name: c.name ?? '', position: c.position ?? '',
      email: c.email ?? '', phone: c.phone ?? '',
    })));
    if (cps.length === 0) {
      setEditContacts([{ name:'', position:'', email:'', phone:'' }]);
    }
    setEditing(true);
    setSaveMsg(null);
  };

  // Re-init invoices after state set in startEdit
  useEffect(() => {
    if (editing && editInvoices.length === 0) {
      setEditInvoices([{ invoice_number:'', invoice_amount:'', unpaid_amount:'', invoice_date:'', due_date:'', item_sold:'', currency_code:'INR' }]);
    }
  }, [editing]);

  const handleGstnLookup = async () => {
    const gstn = editCompany.company_gstn.trim().toUpperCase();
    if (gstn.length < 10) return;
    setGstnStatus('loading');
    try {
      const res = await api.get('/company/lookup', { params: { gstn } });
      const co = res.data?.company;
      if (co) {
        setEditCompany(prev => ({
          ...prev,
          company_gstn: co.gstn ?? prev.company_gstn,
          company_name: co.company_name ?? prev.company_name,
          state: co.state ?? prev.state,
          pincode: co.pincode ?? prev.pincode,
          street_address: co.street_address ?? prev.street_address,
          msme_udyam_number: co.msme_udyam_number ?? prev.msme_udyam_number,
        }));
        setGstnStatus('found');
      } else {
        setGstnStatus('not_found');
      }
    } catch { setGstnStatus('not_found'); }
  };

  const handlePhoneLookup = async (idx: number) => {
    const phone = editContacts[idx].phone.trim();
    if (phone.replace(/\D/g,'').length < 5) return;
    setPhoneStatus(prev => ({ ...prev, [idx]: 'loading' }));
    try {
      const res = await api.get('/contact/lookup', { params: { phone } });
      const ct = res.data?.contact;
      if (ct) {
        setEditContacts(prev => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            name: ct.name ?? updated[idx].name,
            position: ct.position ?? updated[idx].position,
            email: ct.email ?? updated[idx].email,
            phone: ct.phone ?? updated[idx].phone,
          };
          return updated;
        });
        setPhoneStatus(prev => ({ ...prev, [idx]: 'found' }));
      } else {
        setPhoneStatus(prev => ({ ...prev, [idx]: 'not_found' }));
      }
    } catch { setPhoneStatus(prev => ({ ...prev, [idx]: 'not_found' })); }
  };

  const handleSave = async () => {
    if (!incident) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const validInvoices = editInvoices
        .filter(i => i.invoice_amount.trim() || i.unpaid_amount.trim())
        .map(i => ({
          invoice_number: i.invoice_number?.trim() || null,
          invoice_amount: i.invoice_amount ? parseFloat(i.invoice_amount) : null,
          unpaid_amount: i.unpaid_amount ? parseFloat(i.unpaid_amount) : null,
          invoice_date: i.invoice_date || null,
          due_date: i.due_date || null,
          item_sold: i.item_sold.trim() || null,
          currency_code: editIncident.currency_code,
        }));
      const validContacts = editContacts
        .filter(c => c.name.trim())
        .map(c => ({
          name: c.name.trim(),
          position: c.position.trim() || null,
          email: c.email.trim() || null,
          phone: c.phone.trim() || null,
        }));

      const totalInvolved = validInvoices.reduce((s, i) => s + (i.invoice_amount ?? 0), 0);

      const payload = {
        incident_id: incident.id,
        new_data: {
          ...editCompany,
          company_gstn: editCompany.company_gstn || null,
          incident_type: editIncident.incident_type,
          incident_title: `${editIncident.incident_type} - ${editCompany.company_name}`,
          description: editIncident.description,
          currency_code: editIncident.currency_code,
          amount_involved: totalInvolved || null,
        },
        new_invoices: validInvoices,
        new_contacts: validContacts,
      };

      const res = await api.post('/pending-edits', payload);

      if (incident.status === 'draft') {
        setSaveMsg({ type: 'success', text: 'Draft updated successfully.' });
        await loadIncident();
      } else {
        setSaveMsg({ type: 'success', text: res.data?.message ?? 'Edit submitted for moderator review. Original data unchanged until approved.' });
        setHasPendingEdit(true);
      }
      setEditing(false);
    } catch (err: unknown) {
      setSaveMsg({ type: 'error', text: (err as any)?.response?.data?.error ?? 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading incident…</p>
      </div>
    </div>
  );

  if (error || !incident) return (
    <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
      <p className="text-red-600 text-sm">{error ?? 'Incident not found.'}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">← Go back</button>
    </div>
  );

  const status = statusConfig[incident.status] ?? statusConfig['draft'];
  const incidentInvoices: any[] = (incident as any).incident_invoices ?? [];
  const contactPersons: any[] = (incident as any).contact_persons ?? [];

  /* ─────────────────────────── VIEW MODE ─────────────────────────────── */
  if (!editing) return (
    <div className="max-w-3xl mx-auto pb-12 space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-1">
        <Link to="/app/my-incidents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to My Reports
        </Link>
        <div className="flex items-center gap-2">
          {hasPendingEdit && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              Edit Pending Review
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${status.bg} ${status.text}`}>
            {status.label.toUpperCase()}
          </span>
          {isReporter && !hasPendingEdit && (
            <button onClick={startEdit} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Edit
            </button>
          )}
          {hasPendingEdit && (
            <span className="text-xs text-amber-600 italic">Edit in queue — cannot edit again until processed</span>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium ${saveMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {saveMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Incident Report</p>
          <h1 className="text-xl font-bold text-white leading-snug">{incident.company_name}</h1>
          {incident.company_gstn && <p className="text-xs text-slate-300 font-mono mt-1">GSTIN: {incident.company_gstn}</p>}
        </div>
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div><p className={lbl}>Incident Type</p><p className="text-sm font-semibold text-gray-900">{typeLabels[incident.incident_type] ?? incident.incident_type}</p></div>
          <div><p className={lbl}>State</p><p className="text-sm text-gray-700">{(incident as any).state || '—'}</p></div>
          <div><p className={lbl}>Pincode</p><p className="text-sm text-gray-700">{(incident as any).pincode || '—'}</p></div>
          <div><p className={lbl}>Street Address</p><p className="text-sm text-gray-700">{(incident as any).street_address || '—'}</p></div>
          <div><p className={lbl}>MSME / Udyam No.</p><p className="text-sm text-gray-700">{(incident as any).msme_udyam_number || '—'}</p></div>
          <div><p className={lbl}>Total Amount Involved</p><p className="text-sm font-bold text-red-600">{fmtAmt(incident.amount_involved, incident.currency_code)}</p></div>
          <div><p className={lbl}>Date Reported</p><p className="text-sm text-gray-700">{fmt(incident.incident_date ?? incident.created_at)}</p></div>
          <div><p className={lbl}>Submitted</p><p className="text-sm text-gray-700">{new Date(incident.created_at).toLocaleString('en-IN')}</p></div>
          <div><p className={lbl}>Reporter</p><p className="text-sm text-gray-500 italic">Anonymous</p></div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
        <p className={lbl}>Description</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mt-1">{incident.description || <span className="text-gray-400 italic">No description provided.</span>}</p>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Invoices</p>
            <p className="text-xs text-gray-400 mt-0.5">{incidentInvoices.length} invoice{incidentInvoices.length !== 1 ? 's' : ''} on record</p>
          </div>
        </div>
        {incidentInvoices.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400 italic">No invoices recorded for this incident.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                {['#','Invoice No.','Invoice Date','Due Date','Invoice Amount','Unpaid Amount','Item / Product'].map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {incidentInvoices.map((inv: any, idx: number) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx+1}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs whitespace-nowrap">{inv.invoice_number || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(inv.due_date)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmtAmt(inv.invoice_amount, inv.currency_code)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="font-bold text-red-600">{fmtAmt(inv.unpaid_amount, inv.currency_code)}</span></td>
                    <td className="px-4 py-3 text-gray-600">{inv.item_sold || <span className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">Contact Persons</p>
        <p className="text-xs text-gray-400 mb-4">Individuals at the reported company linked to this incident.</p>
        {contactPersons.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No contact persons recorded.</p>
        ) : (
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
        )}
      </div>

      {/* Status notes */}
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
      {incident.status === 'submitted' && <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4"><p className="text-sm text-blue-700 font-medium">This report is awaiting moderation review.</p></div>}
      {incident.status === 'approved' && <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4"><p className="text-sm text-green-700 font-medium">This report is verified and publicly visible.</p></div>}
      {isReporter && incident.status === 'draft' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center gap-3">
          <p className="text-sm text-gray-500 flex-1">This incident is still a draft.</p>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
        </div>
      )}
    </div>
  );

  /* ─────────────────────────── EDIT MODE ─────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-5">
      {/* Edit top bar */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Cancel Edit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 italic">
            {incident.status === 'draft' ? 'Changes apply immediately (draft)' : 'Changes go to moderation before applying'}
          </span>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : incident.status === 'draft' ? 'Save Changes' : 'Submit for Review'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium ${saveMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {saveMsg.text}
        </div>
      )}

      {incident.status !== 'draft' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-800">
          <strong>Note:</strong> This incident is <strong>{incident.status.replace(/_/g,' ')}</strong>. Your edits will be sent for moderator review. Original data stays intact until approved.
        </div>
      )}

      {/* Company Details */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 space-y-4">
        <p className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Company Details</p>
        <div>
          <label className={lbl}>GSTIN</label>
          <div className="relative flex gap-2">
            <input type="text" className={inp} value={editCompany.company_gstn}
              onChange={e => { setEditCompany(p => ({...p, company_gstn: e.target.value})); setGstnStatus('idle'); }}
              placeholder="e.g. 27ABCDE1234F1Z5" maxLength={15} />
            <button type="button" onClick={handleGstnLookup}
              disabled={gstnStatus === 'loading' || editCompany.company_gstn.trim().length < 10}
              className="px-3 py-2 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-40 whitespace-nowrap transition-colors">
              {gstnStatus === 'loading' ? 'Looking…' : 'Lookup'}
            </button>
          </div>
          {gstnStatus === 'found' && <p className="text-xs text-green-600 mt-1">✓ Details auto-filled</p>}
          {gstnStatus === 'not_found' && <p className="text-xs text-gray-400 mt-1">Not found — fill manually</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Company Name <span className="text-red-500">*</span></label>
            <input type="text" className={inp} value={editCompany.company_name}
              onChange={e => setEditCompany(p => ({...p, company_name: e.target.value}))} required /></div>
          <div><label className={lbl}>State <span className="text-red-500">*</span></label>
            <select className={inp} value={editCompany.state} onChange={e => setEditCompany(p => ({...p, state: e.target.value}))}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className={lbl}>Pincode</label>
            <input type="text" className={inp} value={editCompany.pincode}
              onChange={e => setEditCompany(p => ({...p, pincode: e.target.value}))} maxLength={6} placeholder="360001" /></div>
          <div><label className={lbl}>Street Address</label>
            <input type="text" className={inp} value={editCompany.street_address}
              onChange={e => setEditCompany(p => ({...p, street_address: e.target.value}))} /></div>
          <div><label className={lbl}>MSME / Udyam Number</label>
            <input type="text" className={inp} value={editCompany.msme_udyam_number}
              onChange={e => setEditCompany(p => ({...p, msme_udyam_number: e.target.value}))} /></div>
        </div>
      </div>

      {/* Incident Details */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 space-y-4">
        <p className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Incident Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Incident Type <span className="text-red-500">*</span></label>
            <select className={inp} value={editIncident.incident_type}
              onChange={e => setEditIncident(p => ({...p, incident_type: e.target.value as IncidentType}))}>
              {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <div><label className={lbl}>Currency</label>
            <input type="text" className={inp} value={editIncident.currency_code} maxLength={3}
              onChange={e => setEditIncident(p => ({...p, currency_code: e.target.value.toUpperCase()}))} /></div>
        </div>
        <div><label className={lbl}>Description <span className="text-red-500">*</span></label>
          <textarea className={`${inp} resize-y min-h-[100px]`} value={editIncident.description}
            onChange={e => setEditIncident(p => ({...p, description: e.target.value}))} /></div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Invoices</p>
        {editInvoices.map((inv, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">Invoice {idx+1}</span>
              {editInvoices.length > 1 && (
                <button type="button" onClick={() => setEditInvoices(p => p.filter((_,i) => i !== idx))}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors text-sm font-bold">×</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={lbl}>Invoice / Bill No.</label>
                <input type="text" className={inp} placeholder="e.g. INV-2024-001"
                  value={inv.invoice_number}
                  onChange={e => { const u=[...editInvoices]; u[idx]={...u[idx],invoice_number:e.target.value}; setEditInvoices(u); }}
                /></div>
              <div><label className={lbl}>Invoice Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" className={inp} value={inv.invoice_amount} min="0" step="0.01"
                  onChange={e => setEditInvoices(p => { const u=[...p]; u[idx]={...u[idx],invoice_amount:e.target.value}; return u; })} /></div>
              <div><label className={lbl}>Unpaid Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" className={inp} value={inv.unpaid_amount} min="0" step="0.01"
                  onChange={e => setEditInvoices(p => { const u=[...p]; u[idx]={...u[idx],unpaid_amount:e.target.value}; return u; })} /></div>
              <div><label className={lbl}>Invoice Date</label>
                <input type="date" className={inp} value={inv.invoice_date}
                  onChange={e => setEditInvoices(p => { const u=[...p]; u[idx]={...u[idx],invoice_date:e.target.value}; return u; })} /></div>
              <div><label className={lbl}>Due Date</label>
                <input type="date" className={inp} value={inv.due_date}
                  onChange={e => setEditInvoices(p => { const u=[...p]; u[idx]={...u[idx],due_date:e.target.value}; return u; })} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Item / Product Sold</label>
                <input type="text" className={inp} value={inv.item_sold} placeholder="e.g. Cumin Seeds 100kg"
                  onChange={e => setEditInvoices(p => { const u=[...p]; u[idx]={...u[idx],item_sold:e.target.value}; return u; })} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setEditInvoices(p => [...p, { invoice_number:'', invoice_amount:'', unpaid_amount:'', invoice_date:'', due_date:'', item_sold:'', currency_code: editIncident.currency_code }])}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-base">+</span>
          Add invoice
        </button>
      </div>

      {/* Contact Persons */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Contact Persons</p>
        {editContacts.map((cp, idx) => (
          <div key={idx} className={`border rounded-xl p-4 ${phoneStatus[idx] === 'found' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Contact {idx+1}
                {phoneStatus[idx] === 'found' && <span className="ml-2 text-green-600 normal-case font-normal">✓ Auto-filled</span>}
              </span>
              {editContacts.length > 1 && (
                <button type="button" onClick={() => setEditContacts(p => p.filter((_,i) => i !== idx))}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors text-sm font-bold">×</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Phone Number</label>
                <div className="flex gap-2">
                  <input type="tel" className={inp} value={cp.phone} placeholder="Phone"
                    onChange={e => { setEditContacts(p => { const u=[...p]; u[idx]={...u[idx],phone:e.target.value}; return u; }); setPhoneStatus(p => ({...p,[idx]:'idle'})); }} />
                  <button type="button" onClick={() => handlePhoneLookup(idx)}
                    disabled={phoneStatus[idx] === 'loading' || cp.phone.replace(/\D/g,'').length < 5}
                    className="px-3 py-2 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-40 whitespace-nowrap transition-colors">
                    {phoneStatus[idx] === 'loading' ? '…' : 'Lookup'}
                  </button>
                </div>
              </div>
              <div><label className={lbl}>Full Name {idx===0 && <span className="text-red-500">*</span>}</label>
                <input type="text" className={inp} value={cp.name} required={idx===0}
                  onChange={e => setEditContacts(p => { const u=[...p]; u[idx]={...u[idx],name:e.target.value}; return u; })} /></div>
              <div><label className={lbl}>Position / Role</label>
                <input type="text" className={inp} value={cp.position} placeholder="e.g. Proprietor"
                  onChange={e => setEditContacts(p => { const u=[...p]; u[idx]={...u[idx],position:e.target.value}; return u; })} /></div>
              <div><label className={lbl}>Email</label>
                <input type="email" className={inp} value={cp.email}
                  onChange={e => setEditContacts(p => { const u=[...p]; u[idx]={...u[idx],email:e.target.value}; return u; })} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setEditContacts(p => [...p, { name:'', position:'', email:'', phone:'' }])}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-base">+</span>
          Add contact person
        </button>
      </div>

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={() => setEditing(false)} className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : incident.status === 'draft' ? 'Save Changes' : 'Submit Edit for Review'}
        </button>
      </div>
    </div>
  );
}
