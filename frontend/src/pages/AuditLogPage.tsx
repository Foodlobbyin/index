import React, { useState } from 'react';
import { auditLogService, AuditLogSearchParams, AuditLog, AuditLogSearchResult } from '../services/auditLogService';

const AuditLogPage: React.FC = () => {
  const [params, setParams] = useState<AuditLogSearchParams>({
    incident_id: undefined,
    moderator_id: undefined,
    action: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20,
  });
  const [result, setResult] = useState<AuditLogSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSearchParams = (overrides?: Partial<AuditLogSearchParams>): AuditLogSearchParams => {
    const merged = { ...params, ...overrides };
    const clean: AuditLogSearchParams = {};
    if (merged.incident_id != null) clean.incident_id = merged.incident_id;
    if (merged.moderator_id != null) clean.moderator_id = merged.moderator_id;
    if (merged.action) clean.action = merged.action;
    if (merged.date_from) clean.date_from = merged.date_from;
    if (merged.date_to) clean.date_to = merged.date_to;
    if (merged.page != null) clean.page = merged.page;
    if (merged.limit != null) clean.limit = merged.limit;
    return clean;
  };

  const handleSearch = async (overrides?: Partial<AuditLogSearchParams>) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = buildSearchParams(overrides);
      const data = await auditLogService.searchLogs(searchParams);
      setResult(data);
      if (overrides) {
        setParams((prev) => ({ ...prev, ...overrides }));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch audit logs. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    handleSearch({ page: newPage });
  };

  const currentPage = result?.page ?? params.page ?? 1;
  const totalPages = result?.total_pages ?? 0;

  return (
    <div className="space-y-6">
      {/* Filter Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Audit Logs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident ID</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.incident_id ?? ''}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  incident_id: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moderator ID</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.moderator_id ?? ''}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  moderator_id: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              placeholder="APPROVE / REJECT / ESCALATE"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.action ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, action: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.date_from ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, date_from: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.date_to ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Results per page</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.limit ?? 20}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  limit: e.target.value ? Number(e.target.value) : 20,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => handleSearch({ page: 1 })}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Pagination info */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} (Total: {result.total} records)
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {result.logs.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">No audit logs found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['ID', 'Incident ID', 'Moderator ID', 'Action', 'Notes', 'Created At'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.logs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.incident_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.moderator_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.notes ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
