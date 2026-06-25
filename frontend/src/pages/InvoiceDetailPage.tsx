import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceService, Invoice } from '../services/invoiceService';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'PENDING'   },
  paid:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'PAID'      },
  overdue:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'OVERDUE'   },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'CANCELLED' },
};

export default function InvoiceDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoiceById(Number(id));
      setInvoice(data);
    } catch {
      setError('Failed to load invoice. It may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchInvoice();
  }, [id, fetchInvoice]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await invoiceService.deleteInvoice(Number(id));
      navigate('/app/defaults');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Loading invoice…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <Link to="/app/defaults" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <ArrowLeft size={15} /> Back to My Defaults
        </Link>
      </div>
    );
  }

  const cfg = statusConfig[invoice.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: invoice.status.toUpperCase() };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Link
          to="/app/defaults"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={15} />
          Back to My Defaults
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Invoice {invoice.invoice_number}
            </h1>
            <span className={`mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/app/invoices/${invoice.id}/edit`}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Invoice #</p>
            <p className="text-base font-semibold text-gray-900">{invoice.invoice_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{Number(invoice.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          {invoice.amount_unpaid != null && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Amount Unpaid</p>
              <p className="text-xl font-bold text-red-600">
                ₹{Number(invoice.amount_unpaid).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Issue Date</p>
            <p className="text-sm text-gray-800">{new Date(invoice.issue_date).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Due Date</p>
            <p className={`text-sm font-medium ${invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
              {new Date(invoice.due_date).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Category</p>
            <p className="text-sm text-gray-800">{invoice.category || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm text-gray-800">{new Date(invoice.created_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {invoice.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.description}</p>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Delete Invoice?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete invoice{' '}
              <span className="font-medium">"{invoice.invoice_number}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
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
}
