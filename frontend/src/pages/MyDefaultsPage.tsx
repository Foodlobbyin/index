import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, AlertCircle, X } from 'lucide-react';
import { invoiceService, Invoice } from '../services/invoiceService';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'PENDING'   },
  paid:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'PAID'      },
  overdue:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'OVERDUE'   },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'CANCELLED' },
};

const daysSince = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const MyDefaultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await invoiceService.getInvoices();
        setInvoices(data);
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.error ??
          (err as any)?.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to load your invoice defaults.');
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.category || '').toLowerCase().includes(q) ||
      (inv.description || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnpaid = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.amount_unpaid ?? inv.amount), 0);

  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await invoiceService.deleteInvoice(confirmDelete.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== confirmDelete.id));
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        'Failed to delete invoice.';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My Defaults</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Your private invoice ledger — track payments and outstanding amounts.
              </p>
            </div>
          </div>
          <Link
            to="/app/invoices/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Invoice
          </Link>
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4">
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{overdueCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Total Unpaid</p>
            <p className="text-xl font-bold text-red-700 mt-1">
              ₹{totalUnpaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* ── Invoice Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice #, category, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading your invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-600 font-medium">
              {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your search'}
            </p>
            {invoices.length === 0 && (
              <>
                <p className="text-gray-400 text-sm mt-1">
                  Add your first invoice to start tracking payments.
                </p>
                <Link
                  to="/app/invoices/new"
                  className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Invoice
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice #', 'Amount', 'Issue Date', 'Due Date', 'Status', 'Category', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((invoice) => {
                  const cfg = statusConfig[invoice.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: invoice.status.toUpperCase() };
                  const daysOverdue = invoice.status === 'overdue' ? daysSince(invoice.due_date) : 0;
                  const isDeleting = deletingId === invoice.id;

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium">
                        <Link
                          to={`/app/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                        ₹{Number(invoice.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        {invoice.amount_unpaid != null && invoice.amount_unpaid !== invoice.amount && (
                          <span className="block text-xs text-gray-400 font-normal">
                            ₹{Number(invoice.amount_unpaid).toLocaleString('en-IN', { maximumFractionDigits: 0 })} unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(invoice.issue_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        <span className={invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                        </span>
                        {daysOverdue > 0 && (
                          <span className="block text-xs text-red-500">{daysOverdue}d overdue</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {invoice.category || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/app/invoices/${invoice.id}`}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/app/invoices/${invoice.id}/edit`}
                            className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(invoice)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Help Note ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">About My Defaults:</span> These are private invoice records
          linked to your company's transactions. They are not publicly visible and are only used
          internally to support your incident reports.
        </p>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Delete Invoice?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete invoice{' '}
              <span className="font-medium">"{confirmDelete.invoice_number}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
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

export default MyDefaultsPage;
