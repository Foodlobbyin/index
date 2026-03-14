import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  incidentService,
  Incident,
  IncidentUpdateInput,
  IncidentType,
} from '../services/incidentService';

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'CONTRACT_BREACH', label: 'Contract Breach' },
  { value: 'OTHER', label: 'Other' },
];

const MODERATOR_LEVELS = ['moderator', 'admin'] as const;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  resolved: 'bg-purple-100 text-purple-700',
};

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<IncidentUpdateInput>({});
  const [editLoading, setEditLoading] = useState(false);

  // Moderation state
  const [modNotes, setModNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [modLoading, setModLoading] = useState(false);

  const isModerator =
    !!user?.trust_level && MODERATOR_LEVELS.includes(user.trust_level as (typeof MODERATOR_LEVELS)[number]);
  const isReporter = !!user && incident?.reporter_id === user.id && !incident?.is_anonymous;

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError('Invalid incident ID.');
      setLoading(false);
      return;
    }
    incidentService
      .getById(numId)
      .then((data) => {
        setIncident(data);
        setEditData({
          company_gstn: data.company_gstn,
          company_name: data.company_name,
          incident_type: data.incident_type,
          incident_date: data.incident_date.split('T')[0],
          incident_title: data.incident_title,
          description: data.description,
          amount_involved: data.amount_involved,
          currency_code: data.currency_code,
        });
      })
      .catch((err: unknown) => {
        const msg =
          (err as any)?.response?.data?.error ??
          (err as any)?.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to load incident.');
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'amount_involved') {
      setEditData((prev) => ({ ...prev, amount_involved: value === '' ? undefined : parseFloat(value) }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!incident) return;
    setEditLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await incidentService.update(incident.id, editData);
      setIncident(updated);
      setEditing(false);
      setActionSuccess('Incident updated successfully.');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to update incident.');
      setActionError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!incident) return;
    if (!window.confirm('Are you sure you want to delete this incident?')) return;
    setActionError(null);
    try {
      await incidentService.remove(incident.id);
      navigate('/app/incidents');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to delete incident.');
      setActionError(msg);
    }
  };

  const handleApprove = async () => {
    if (!incident) return;
    setModLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await incidentService.approveIncident(incident.id, modNotes || undefined);
      const updated = await incidentService.getById(incident.id);
      setIncident(updated);
      setActionSuccess('Incident approved.');
      setModNotes('');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to approve incident.');
      setActionError(msg);
    } finally {
      setModLoading(false);
    }
  };

  const handleReject = async () => {
    if (!incident) return;
    if (!rejectReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    setModLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await incidentService.rejectIncident(incident.id, rejectReason, modNotes || undefined);
      const updated = await incidentService.getById(incident.id);
      setIncident(updated);
      setActionSuccess('Incident rejected.');
      setModNotes('');
      setRejectReason('');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to reject incident.');
      setActionError(msg);
    } finally {
      setModLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading incident…</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700">
        {error ?? 'Incident not found.'}
      </div>
    );
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link to="/app/incidents" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          ← Back to Incidents
        </Link>
      </div>

      {/* Feedback messages */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          {actionSuccess}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{incident.incident_title}</h2>
            <p className="text-sm text-gray-500 mt-1">{incident.company_name}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[incident.status] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {incident.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Detail grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm mt-4">
          <div>
            <dt className="font-medium text-gray-500">GSTIN</dt>
            <dd className="text-gray-900 mt-1">{incident.company_gstn ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Incident Type</dt>
            <dd className="text-gray-900 mt-1">{incident.incident_type.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Incident Date</dt>
            <dd className="text-gray-900 mt-1">{new Date(incident.incident_date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Amount Involved</dt>
            <dd className="text-gray-900 mt-1">
              {incident.amount_involved != null
                ? `${incident.currency_code} ${incident.amount_involved.toLocaleString()}`
                : '—'}
            </dd>
          </div>
          {!incident.is_anonymous && incident.reporter_name && (
            <div>
              <dt className="font-medium text-gray-500">Reporter</dt>
              <dd className="text-gray-900 mt-1">{incident.reporter_name}</dd>
            </div>
          )}
          {!incident.is_anonymous && incident.reporter_email && (
            <div>
              <dt className="font-medium text-gray-500">Reporter Email</dt>
              <dd className="text-gray-900 mt-1">{incident.reporter_email}</dd>
            </div>
          )}
          {incident.is_anonymous && (
            <div>
              <dt className="font-medium text-gray-500">Reporter</dt>
              <dd className="text-gray-500 mt-1 italic">Anonymous</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-gray-500">Submitted</dt>
            <dd className="text-gray-900 mt-1">{new Date(incident.created_at).toLocaleString()}</dd>
          </div>
        </dl>

        {/* Description */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-sm text-gray-900 whitespace-pre-line">{incident.description}</p>
        </div>

        {/* Moderator notes / rejection reason */}
        {incident.moderator_notes && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-600 uppercase mb-1">Moderator Notes</p>
            <p className="text-sm text-blue-900">{incident.moderator_notes}</p>
          </div>
        )}
        {incident.rejection_reason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-medium text-red-600 uppercase mb-1">Rejection Reason</p>
            <p className="text-sm text-red-900">{incident.rejection_reason}</p>
          </div>
        )}

        {/* Reporter actions */}
        {isReporter && !editing && (
          <div className="mt-6 flex items-center space-x-3 border-t border-gray-100 pt-4">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && isReporter && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Incident</h3>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Company GSTIN</label>
              <input
                type="text"
                name="company_gstn"
                className={inputClass}
                value={editData.company_gstn ?? ''}
                onChange={handleEditChange}
                disabled={editLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="company_name"
                className={inputClass}
                value={editData.company_name ?? ''}
                onChange={handleEditChange}
                required
                disabled={editLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Incident Type <span className="text-red-500">*</span></label>
              <select
                name="incident_type"
                className={inputClass}
                value={editData.incident_type ?? 'FRAUD'}
                onChange={handleEditChange}
                required
                disabled={editLoading}
              >
                {INCIDENT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Incident Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="incident_date"
                className={inputClass}
                value={editData.incident_date ?? ''}
                onChange={handleEditChange}
                required
                disabled={editLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="incident_title"
                className={inputClass}
                value={editData.incident_title ?? ''}
                onChange={handleEditChange}
                required
                disabled={editLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Description <span className="text-red-500">*</span></label>
              <textarea
                name="description"
                className={`${inputClass} resize-y min-h-[100px]`}
                value={editData.description ?? ''}
                onChange={handleEditChange}
                required
                disabled={editLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount Involved</label>
                <input
                  type="number"
                  name="amount_involved"
                  className={inputClass}
                  value={editData.amount_involved ?? ''}
                  onChange={handleEditChange}
                  min="0"
                  step="0.01"
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <input
                  type="text"
                  name="currency_code"
                  className={inputClass}
                  value={editData.currency_code ?? 'INR'}
                  onChange={handleEditChange}
                  maxLength={3}
                  disabled={editLoading}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={editLoading}
                className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Moderation controls */}
      {isModerator && (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Moderation Controls</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea
                className={`${inputClass} resize-y`}
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="Add notes visible to all parties…"
                disabled={modLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Rejection Reason (required to reject)</label>
              <input
                type="text"
                className={inputClass}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection…"
                disabled={modLoading}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleApprove}
                disabled={modLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {modLoading ? 'Processing…' : 'Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={modLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {modLoading ? 'Processing…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentDetailPage;
