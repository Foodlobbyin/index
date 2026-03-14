import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoiceService, InvoiceInput } from '../services/invoiceService';

export default function InvoiceEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
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

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoiceById(Number(id));
      setFormData({
        invoice_number: data.invoice_number,
        amount: data.amount,
        issue_date: data.issue_date.split('T')[0],
        due_date: data.due_date.split('T')[0],
        status: data.status,
        description: data.description || '',
        category: data.category || '',
      });
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
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.6 : 1,
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

  if (loading) {
    return (
      <Layout>
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>Loading invoice…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '12px' }}>
          <Link
            to={`/app/invoices/${id}`}
            style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}
          >
            ← Back to Invoice
          </Link>
        </div>

        <h1 style={{ color: '#2c3e50', marginBottom: '30px', marginTop: 0 }}>Edit Invoice</h1>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Invoice Number *</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={saving}
              />
            </div>
            <div>
              <label style={labelStyle}>Amount *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                style={inputStyle}
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={inputStyle}
                disabled={saving}
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
                disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <button type="submit" style={buttonStyle} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link to={`/app/invoices/${id}`} style={cancelStyle}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
