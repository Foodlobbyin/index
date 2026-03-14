import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService, IncidentCreateInput, IncidentType } from '../services/incidentService';

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'CONTRACT_BREACH', label: 'Contract Breach' },
  { value: 'OTHER', label: 'Other' },
];

const ReportIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IncidentCreateInput>({
    company_gstn: '',
    company_name: '',
    incident_type: 'FRAUD',
    incident_date: '',
    incident_title: '',
    description: '',
    amount_involved: undefined,
    currency_code: 'INR',
    is_anonymous: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'amount_involved') {
      setFormData((prev) => ({
        ...prev,
        amount_involved: value === '' ? undefined : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: IncidentCreateInput = {
        ...formData,
        company_gstn: formData.company_gstn || undefined,
        amount_involved: formData.amount_involved ?? undefined,
      };
      const incident = await incidentService.submit(payload);
      navigate(`/app/incidents/${incident.id}`);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to submit incident.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Report an Incident</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company GSTIN */}
          <div>
            <label className={labelClass}>Company GSTIN</label>
            <input
              type="text"
              name="company_gstn"
              className={inputClass}
              value={formData.company_gstn ?? ''}
              onChange={handleChange}
              placeholder="e.g. 29ABCDE1234F1Z5"
              disabled={loading}
            />
          </div>

          {/* Company Name */}
          <div>
            <label className={labelClass}>
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company_name"
              className={inputClass}
              value={formData.company_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Incident Type */}
          <div>
            <label className={labelClass}>
              Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              name="incident_type"
              className={inputClass}
              value={formData.incident_type}
              onChange={handleChange}
              required
              disabled={loading}
            >
              {INCIDENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Date */}
          <div>
            <label className={labelClass}>
              Incident Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="incident_date"
              className={inputClass}
              value={formData.incident_date}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Incident Title */}
          <div>
            <label className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="incident_title"
              className={inputClass}
              value={formData.incident_title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              className={`${inputClass} resize-y min-h-[100px]`}
              value={formData.description}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount Involved</label>
              <input
                type="number"
                name="amount_involved"
                className={inputClass}
                value={formData.amount_involved ?? ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input
                type="text"
                name="currency_code"
                className={inputClass}
                value={formData.currency_code ?? 'INR'}
                onChange={handleChange}
                maxLength={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_anonymous"
              name="is_anonymous"
              checked={formData.is_anonymous ?? false}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_anonymous" className="text-sm text-gray-700">
              Submit anonymously (your name and email will not be shown)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/incidents')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentPage;
