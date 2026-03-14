import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoiceService, Invoice } from '../services/invoiceService';

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return '#27ae60';
    case 'pending':
      return '#f39c12';
    case 'overdue':
      return '#e74c3c';
    case 'cancelled':
      return '#95a5a6';
    default:
      return '#7f8c8d';
  }
};

export default function InvoiceList(): JSX.Element {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '14px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #ddd',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  };

  return (
    <Layout>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Invoices</h1>
          <Link to="/app/invoices/new" style={buttonStyle}>
            + Create Invoice
          </Link>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* Search & filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by invoice #, category, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 240px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, minWidth: '140px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>Loading invoices…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            {invoices.length === 0
              ? 'No invoices found. Click "+ Create Invoice" to add your first invoice.'
              : 'No invoices match your search.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Issue Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={tdStyle}>
                      <Link
                        to={`/app/invoices/${invoice.id}`}
                        style={{ color: '#3498db', textDecoration: 'none' }}
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td style={tdStyle}>${invoice.amount.toFixed(2)}</td>
                    <td style={tdStyle}>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td style={tdStyle}>{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: getStatusColor(invoice.status),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>{invoice.category || '-'}</td>
                    <td style={tdStyle}>
                      <Link
                        to={`/app/invoices/${invoice.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '5px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        View
                      </Link>
                      <Link
                        to={`/app/invoices/${invoice.id}/edit`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
