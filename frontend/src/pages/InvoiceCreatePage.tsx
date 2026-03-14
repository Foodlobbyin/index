import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoiceService, InvoiceInput } from '../services/invoiceService';

export default function InvoiceCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<InvoiceInput>({
    invoice_number: '',
    amount: 0,
    issue_date: '',
    due_date: '',
    status: 'pending',
    description: '',
    category: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await invoiceService.createInvoice(formData);
      navigate(`/app/invoices/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  const cancelStyle: React.CSSProperties = {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    marginLeft: '10px',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  };

  return (
    <Layout>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '12px' }}>
          <Link to="/app/invoices" style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Invoices
          </Link>
        </div>

        <h1 style={{ color: '#2c3e50', marginBottom: '30px', marginTop: 0 }}>Create Invoice</h1>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Invoice Number *</label>
              <input
                type="text"
                name="invoice_number"
                placeholder="e.g. INV-001"
                value={formData.invoice_number}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Amount *</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                style={inputStyle}
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Issue Date *</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date *</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={loading}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input
                type="text"
                name="category"
                placeholder="e.g. Services, Products"
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              placeholder="Optional description or notes"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? 'Creating…' : 'Create Invoice'}
            </button>
            <Link to="/app/invoices" style={cancelStyle}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
