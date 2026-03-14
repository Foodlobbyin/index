import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function InvoiceDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoiceById(Number(id));
      setInvoice(data);
    } catch (err: any) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchInvoice();
  }, [id, fetchInvoice]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await invoiceService.deleteInvoice(Number(id));
      navigate('/app/invoices', { state: { message: 'Invoice deleted successfully.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
      setDeleting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const fieldLabelStyle: React.CSSProperties = {
    color: '#7f8c8d',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  const fieldValueStyle: React.CSSProperties = {
    color: '#2c3e50',
    fontSize: '16px',
    marginBottom: '24px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0 30px',
  };

  if (loading) {
    return (
      <Layout>
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>Loading invoice…</p>
        </div>
      </Layout>
    );
  }

  if (error || !invoice) {
    return (
      <Layout>
        <div style={cardStyle}>
          {error && <div style={errorStyle}>{error}</div>}
          <Link to="/app/invoices" style={{ color: '#3498db', textDecoration: 'none' }}>
            ← Back to Invoices
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/app/invoices" style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
              ← Back to Invoices
            </Link>
            <h1 style={{ color: '#2c3e50', margin: '8px 0 0 0' }}>
              Invoice {invoice.invoice_number}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to={`/app/invoices/${invoice.id}/edit`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-block',
              }}
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
                fontSize: '14px',
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* Status badge */}
        <div style={{ marginBottom: '30px' }}>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              backgroundColor: getStatusColor(invoice.status),
              color: 'white',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            {invoice.status.toUpperCase()}
          </span>
        </div>

        <div style={gridStyle}>
          <div>
            <p style={fieldLabelStyle}>Invoice Number</p>
            <p style={fieldValueStyle}>{invoice.invoice_number}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Amount</p>
            <p style={{ ...fieldValueStyle, fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
              ${invoice.amount.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Issue Date</p>
            <p style={fieldValueStyle}>{new Date(invoice.issue_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Due Date</p>
            <p style={fieldValueStyle}>{new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Category</p>
            <p style={fieldValueStyle}>{invoice.category || '—'}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Created</p>
            <p style={fieldValueStyle}>{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {invoice.description && (
          <div>
            <p style={fieldLabelStyle}>Description</p>
            <p style={{ ...fieldValueStyle, whiteSpace: 'pre-wrap' }}>{invoice.description}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
