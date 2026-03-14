import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentService, IncidentSearchParams, Incident, IncidentSearchResult, IncidentType } from '../services/incidentService';

const INCIDENT_TYPES: IncidentType[] = [
  'FRAUD',
  'QUALITY_ISSUE',
  'SERVICE_ISSUE',
  'PAYMENT_ISSUE',
  'CONTRACT_BREACH',
  'OTHER',
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  resolved: 'bg-purple-100 text-purple-700',
};

const LIMIT = 20;

const IncidentListPage: React.FC = () => {
  const [params, setParams] = useState<IncidentSearchParams>({
    company_name: '',
    gstn: '',
    incident_type: '',
    page: 1,
    limit: LIMIT,
  });
  const [result, setResult] = useState<IncidentSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (overrides?: Partial<IncidentSearchParams>) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { ...params, ...overrides };
      const clean: IncidentSearchParams = { page: merged.page, limit: merged.limit };
      if (merged.company_name) clean.company_name = merged.company_name;
      if (merged.gstn) clean.gstn = merged.gstn;
      if (merged.incident_type) clean.incident_type = merged.incident_type;
      const data = await incidentService.search(clean);
      setResult(data);
      if (overrides) setParams((prev) => ({ ...prev, ...overrides }));
      setSearched(true);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to load incidents.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentPage = params.page ?? 1;
  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Incidents</h2>
          <Link
            to="/app/incidents/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Report Incident
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              placeholder="Search by company name…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.company_name ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, company_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="Search by GSTIN…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.gstn ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, gstn: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={params.incident_type ?? ''}
              onChange={(e) => setParams((prev) => ({ ...prev, incident_type: e.target.value }))}
            >
              <option value="">All Types</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
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
          {/* Pagination header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {result.total === 0
                ? 'No incidents found.'
                : `Page ${currentPage} of ${totalPages} (${result.total} total)`}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSearch({ page: currentPage - 1 })}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handleSearch({ page: currentPage + 1 })}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table */}
          {result.incidents.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">
              {searched ? 'No incidents match your search.' : 'Search above to view incidents.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Company', 'GSTIN', 'Type', 'Date', 'Title', 'Status'].map((col) => (
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
                  {result.incidents.map((incident: Incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          to={`/app/incidents/${incident.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {incident.company_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.company_gstn ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {incident.incident_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {incident.incident_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[incident.status] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {incident.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty state before first search */}
      {!result && !loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">
            Use the search above to find incidents. All approved and resolved incidents are publicly visible.
          </p>
        </div>
      )}
    </div>
  );
};

export default IncidentListPage;
