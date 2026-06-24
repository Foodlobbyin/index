import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface CompanyData {
  company_id?: number;
  id: number;
  company_name: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  revenue: number | null;
  employees: number | null;
  reputation_score: number | null;
  gstn: string | null;
  phone_number: string | null;
  invoice_count: number;
  unpaid_amount: number;
  total_invoice_amount: number;
  updated_at: string;
}

export default function CompanyView(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/company/view/${id}`)
      .then(res => setCompany(res.data.company))
      .catch(err => setError(err?.response?.data?.error || 'Company not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const card: React.CSSProperties = {
    backgroundColor: 'white', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 24, marginBottom: 20,
  };
  const label: React.CSSProperties = {
    fontSize: 11, color: '#6b7280', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  };
  const value: React.CSSProperties = { fontSize: 15, color: '#111827', fontWeight: 500 };

  const repColor = (score: number | null) => {
    if (!score) return '#6b7280';
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Loading company profile...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: 16, marginBottom: 16 }}>{error || 'Company not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '8px 20px', borderRadius: 7, border: '1px solid #d1d5db',
            backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20, background: 'none', border: 'none',
          color: '#3b82f6', cursor: 'pointer', fontSize: 14, padding: 0 }}
      >
        ← Back to Search
      </button>

      {/* Header */}
      <div style={{ ...card, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {company.company_name}
            </h1>
            {(company.city || company.country) && (
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                {[company.city, company.country].filter(Boolean).join(', ')}
              </p>
            )}
            {company.industry && (
              <span style={{ display: 'inline-block', marginTop: 8, padding: '2px 10px',
                backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {company.industry}
              </span>
            )}
          </div>
          {company.reputation_score !== null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: repColor(company.reputation_score) }}>
                {company.reputation_score}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Reputation
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'GSTIN', val: company.gstn || '—' },
          { label: 'Phone', val: company.phone_number || '—' },
          { label: 'Total Invoices', val: String(company.invoice_count) },
          {
            label: 'Unpaid Amount',
            val: company.unpaid_amount > 0
              ? `₹${Number(company.unpaid_amount).toLocaleString('en-IN')}`
              : 'All Paid',
            highlight: company.unpaid_amount > 0,
          },
        ].map(item => (
          <div key={item.label} style={card}>
            <p style={label}>{item.label}</p>
            <p style={{ ...value, color: item.highlight ? '#dc2626' : '#111827', fontFamily: item.label === 'GSTIN' ? 'monospace' : 'inherit' }}>
              {item.val}
            </p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div style={card}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Company Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
          {company.address && (
            <div>
              <p style={label}>Address</p>
              <p style={value}>{company.address}</p>
            </div>
          )}
          {company.website && (
            <div>
              <p style={label}>Website</p>
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                style={{ ...value, color: '#2563eb' }}>
                {company.website}
              </a>
            </div>
          )}
          {company.revenue !== null && (
            <div>
              <p style={label}>Revenue</p>
              <p style={value}>₹{Number(company.revenue).toLocaleString('en-IN')}</p>
            </div>
          )}
          {company.employees !== null && (
            <div>
              <p style={label}>Employees</p>
              <p style={value}>{company.employees}</p>
            </div>
          )}
          <div>
            <p style={label}>Total Business</p>
            <p style={value}>₹{Number(company.total_invoice_amount).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p style={label}>Last Updated</p>
            <p style={value}>{new Date(company.updated_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
