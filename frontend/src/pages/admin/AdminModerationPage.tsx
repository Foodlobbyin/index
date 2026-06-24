import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { incidentService, Incident } from '../../services/incidentService';

type FilterStatus = 'submitted' | 'under_review' | 'all';

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const daysSince = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const AdminModerationPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [notesModal, setNotesModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentService.getModerationQueue();
      setIncidents(data);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to load queue.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const filtered = incidents.filter((i) => {
    if (filterStatus === 'all') return true;
    return i.status === filterStatus;
  });

  const openApproveModal = (id: number) => {
    setNotesInput('');
    setRejectReason('');
    setNotesModal({ id, action: 'approve' });
  };

  const openRejectModal = (id: number) => {
    setNotesInput('');
    setRejectReason('');
    setNotesModal({ id, action: 'reject' });
  };

  const handleMarkUnderReview = async (id: number) => {
    setActionStates((prev) => ({ ...prev, [id]: 'reviewing' }));
    try {
      await api.put(`/moderation/incidents/${id}/review`);
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'under_review' as any } : i))
      );
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to mark under review.';
      setError(msg);
    } finally {
      setActionStates((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleConfirmAction = async () => {
    if (!notesModal) return;
    const { id, action } = notesModal;

    if (action === 'reject' && !rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setActionStates((prev) => ({ ...prev, [id]: action === 'approve' ? 'approving' : 'rejecting' }));
    setNotesModal(null);

    try {
      if (action === 'approve') {
        await incidentService.approveIncident(id, notesInput || undefined);
      } else {
        await incidentService.rejectIncident(id, rejectReason, notesInput || undefined);
      }
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        `Failed to ${action}.`;
      setError(msg);
    } finally {
      setActionStates((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const counts = {
    all: incidents.length,
    submitted: incidents.filter((i) => i.status === 'submitted').length,
    under_review: incidents.filter((i) => i.status === 'under_review').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Incident Moderation</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review, approve or reject user-submitted fraud incidents before they become publicly visible.
            </p>
          </div>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { key: 'all', label: 'Total Pending', color: 'bg-gray-50 border-gray-200 text-gray-700' },
            { key: 'submitted', label: 'Awaiting Review', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { key: 'under_review', label: 'Under Review', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`rounded-lg border p-4 text-center transition-all ${color} ${
                filterStatus === key ? 'ring-2 ring-offset-1 ring-blue-400' : ''
              }`}
            >
              <p className="text-2xl font-bold">{counts[key]}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">Loading moderation queue…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-600 font-medium">Queue is clear</p>
          <p className="text-gray-400 text-sm mt-1">No incidents pending moderation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Title', 'Company', 'Type', 'Amount', 'Submitted', 'Age', 'Status', 'Reporter', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((incident) => {
                  const busy = !!actionStates[incident.id];
                  const age = daysSince(incident.created_at);
                  const isOld = age >= 3;

                  return (
                    <tr key={incident.id} className={`hover:bg-gray-50 transition-colors ${isOld ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-4 text-xs text-gray-400">#{incident.id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-[200px]">
                        <Link
                          to={`/app/incidents/${incident.id}`}
                          target="_blank"
                          rel="noreferrer"
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
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {incident.amount_involved
                          ? `${incident.currency_code} ${Number(incident.amount_involved).toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(incident.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOld ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {age}d
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[incident.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {incident.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {incident.is_anonymous ? (
                          <span className="italic text-gray-400">Anonymous</span>
                        ) : (
                          incident.reporter_name ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {incident.status === 'submitted' && (
                            <button
                              onClick={() => handleMarkUnderReview(incident.id)}
                              disabled={busy}
                              className="px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            >
                              {actionStates[incident.id] === 'reviewing' ? '…' : 'Review'}
                            </button>
                          )}
                          <button
                            onClick={() => openApproveModal(incident.id)}
                            disabled={busy}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {actionStates[incident.id] === 'approving' ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openRejectModal(incident.id)}
                            disabled={busy}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {actionStates[incident.id] === 'rejecting' ? '…' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {notesModal.action === 'approve' ? '✅ Approve Incident' : '❌ Reject Incident'}
            </h3>

            {notesModal.action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Insufficient evidence, duplicate report…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moderator Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Internal notes visible only to moderators…"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                autoFocus={notesModal.action === 'approve'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  notesModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {notesModal.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => setNotesModal(null)}
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

export default AdminModerationPage;
