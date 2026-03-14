import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { incidentService, Incident } from '../services/incidentService';

const MODERATOR_LEVELS = ['moderator', 'admin'] as const;

const ModerationQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<number, string>>({});

  const isModerator =
    !!user?.trust_level &&
    MODERATOR_LEVELS.includes(user.trust_level as (typeof MODERATOR_LEVELS)[number]);

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
        (err instanceof Error ? err.message : 'Failed to load moderation queue.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModerator) {
      fetchQueue();
    }
  }, [isModerator]);

  if (!isModerator) {
    return <Navigate to="/app" replace />;
  }

  const handleApprove = async (incident: Incident) => {
    setActionStates((prev) => ({ ...prev, [incident.id]: 'approving' }));
    try {
      await incidentService.approveIncident(incident.id);
      setIncidents((prev) => prev.filter((i) => i.id !== incident.id));
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to approve.';
      setError(msg);
    } finally {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[incident.id];
        return next;
      });
    }
  };

  const handleReject = async (incident: Incident) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      setError('Rejection reason cannot be empty.');
      return;
    }
    setActionStates((prev) => ({ ...prev, [incident.id]: 'rejecting' }));
    try {
      await incidentService.rejectIncident(incident.id, reason);
      setIncidents((prev) => prev.filter((i) => i.id !== incident.id));
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to reject.';
      setError(msg);
    } finally {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[incident.id];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Moderation Queue</h2>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading queue…</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No incidents pending review. Queue is empty.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Title', 'Company', 'Type', 'Date', 'Reporter', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => {
                  const busy = !!actionStates[incident.id];
                  return (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                        <Link
                          to={`/app/incidents/${incident.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {incident.incident_title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {incident.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.incident_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.is_anonymous
                          ? 'Anonymous'
                          : incident.reporter_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(incident)}
                            disabled={busy}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionStates[incident.id] === 'approving' ? 'Approving…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(incident)}
                            disabled={busy}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionStates[incident.id] === 'rejecting' ? 'Rejecting…' : 'Reject'}
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
    </div>
  );
};

export default ModerationQueuePage;
