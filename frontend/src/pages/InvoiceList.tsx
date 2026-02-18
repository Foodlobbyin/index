import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { invoiceService, Invoice, InvoiceInput } from '../services/invoiceService';

export default function InvoiceList(): JSX.Element {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InvoiceInput>({
    invoice_number: '',
    amount: 0,
    issue_date: '',
    due_date: '',
    status: 'pending',
    description: '',
    category: '',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingId) {
        await invoiceService.updateInvoice(editingId, formData);
        setSuccess('Invoice updated successfully!');
      } else {
        await invoiceService.createInvoice(formData);
        setSuccess('Invoice created successfully!');
      }
      await fetchInvoices();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData({
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      issue_date: invoice.issue_date.split('T')[0],
      due_date: invoice.due_date.split('T')[0],
      status: invoice.status,
      description: invoice.description || '',
      category: invoice.category || '',
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    setLoading(true);
    try {
      await invoiceService.deleteInvoice(id);
      setSuccess('Invoice deleted successfully!');
      await fetchInvoices();
    } catch (err: any) {
      setError('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      amount: 0,
      issue_date: '',
      due_date: '',
      status: 'pending',
      description: '',
      category: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
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

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
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

  const successStyle: React.CSSProperties = {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

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

  return (
    <Layout>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Invoices</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ ...buttonStyle, backgroundColor: showForm ? '#95a5a6' : '#27ae60' }}
          >
            {showForm ? 'Cancel' : '+ Add Invoice'}
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        {showForm && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
              {editingId ? 'Edit Invoice' : 'Add New Invoice'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <input
                  type="text"
                  name="invoice_number"
                  placeholder="Invoice Number *"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount *"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  required
                  step="0.01"
                  style={inputStyle}
                  disabled={loading}
                />
                <input
                  type="date"
                  name="issue_date"
                  placeholder="Issue Date *"
                  value={formData.issue_date}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
                <input
                  type="date"
                  name="due_date"
                  placeholder="Due Date *"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
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
                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              />
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Invoice' : 'Create Invoice'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ ...buttonStyle, backgroundColor: '#95a5a6' }}>
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        )}

        {loading && !showForm ? (
          <p>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            No invoices found. Click "Add Invoice" to create your first invoice.
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={tdStyle}>{invoice.invoice_number}</td>
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
                      <button
                        onClick={() => handleEdit(invoice)}
                        style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        style={{
                          ...buttonStyle,
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#e74c3c',
                          marginRight: 0,
                        }}
                      >
                        Delete
                      </button>
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
