import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceService, InvoiceInput } from '../services/invoiceService';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function InvoiceEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<InvoiceInput>({
    invoice_number: '',
    amount: 0,
    amount_unpaid: undefined,
    issue_date: '',
    due_date: '',
    status: 'pending',
    description: '',
    category: '',
  });

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoiceById(Number(id));
      setFormData({
        invoice_number: data.invoice_number,
        amount: data.amount,
        amount_unpaid: data.amount_unpaid ?? undefined,
        issue_date: data.issue_date.split('T')[0],
        due_date: data.due_date.split('T')[0],
        status: data.status,
        description: data.description || '',
        category: data.category || '',
      });
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchInvoice();
  }, [id, fetchInvoice]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await invoiceService.updateInvoice(Number(id), formData);
      navigate(`/app/invoices/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Loading invoice…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Link
          to={`/app/invoices/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={15} />
          Back to Invoice
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Edit Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details of this invoice.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Invoice Number *</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                required
                className={inputCls}
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Invoice Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                placeholder="Total invoice value"
                value={formData.amount || ''}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className={inputCls}
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Amount Unpaid (₹)</label>
              <input
                type="number"
                name="amount_unpaid"
                placeholder="Outstanding balance"
                value={formData.amount_unpaid ?? ''}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={inputCls}
                disabled={saving}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if the full amount is unpaid.</p>
            </div>
            <div>
              <label className={labelCls}>Issue Date *</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
                className={inputCls}
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Due Date *</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className={inputCls}
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputCls}
                disabled={saving}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input
                type="text"
                name="category"
                placeholder="e.g. Services, Products"
                value={formData.category}
                onChange={handleChange}
                className={inputCls}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              placeholder="Optional description or notes"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`${inputCls} resize-vertical`}
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link
              to={`/app/invoices/${id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
