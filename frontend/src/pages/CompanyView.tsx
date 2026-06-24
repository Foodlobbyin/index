import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface IncidentInvoice {
  id: number;
  incident_id: number;
  invoice_amount: number | null;
  unpaid_amount: number | null;
  invoice_date: string | null;
  due_date: string | null;
  item_sold: string | null;
  currency_code: string;
  category: string | null;
}

interface ContactPerson {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
}

interface CompanyViewData {
  company_name: string;
  gstn: string;
  total_invoices: number;
  total_unpaid: number;
  invoices: IncidentInvoice[];
  contact_persons: ContactPerson[];
}

function daysOverdue(dueDateStr: string | null): number | null {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function categoryLabel(cat: string | null): string {
  if (!cat) return '—';
  const map: Record<string, string> = {
    FRAUD: 'Fraud',
    PAYMENT_ISSUE: 'Payment Delay',
    QUALITY_ISSUE: 'Quality Issue',
    SERVICE_ISSUE: 'Service Issue',
    CONTRACT_BREACH: 'Contract Breach',
    OTHER: 'Other',
  };
  return map[cat] || cat;
}

function categoryBadge(cat: string | null): JSX.Element {
  const map: Record<string, { bg: string; color: string }> = {
    FRAUD:           { bg: '#fee2e2', color: '#991b1b' },
    PAYMENT_ISSUE:   { bg: '#fef3c7', color: '#92400e' },
    QUALITY_ISSUE:   { bg: '#e0f2fe', color: '#0c4a6e' },
    SERVICE_ISSUE:   { bg: '#f3e8ff', color: '#6b21a8' },
    CONTRACT_BREACH: { bg: '#ffedd5', color: '#9a3412' },
    OTHER:           { bg: '#f3f4f6', color: '#374151' },
  };
  const m = (cat && map[cat]) ? map[cat] : { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      backgroundColor: m.bg, color: m.color, whiteSpace: 'nowrap',
    }}>
      {categoryLabel(cat)}
    </span>
  );
}

export default function CompanyView(): JSX.Element {
  const { gstn, name } = useParams<{ gstn?: string; name?: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CompanyViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (gstn) params.gstn = decodeURIComponent(gstn);
    else if (name) params.name = decodeURIComponent(name);
    else {
      setError('No company identifier provided.');
      setLoading(false);
      return;
    }
    api.get('/company/view-by-gstn', { params })
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || 'Company not found.'))
      .finally(() => setLoading(false));
  }, [gstn, name]);

  const card: React.CSSProperties = {
    backgroundColor: 'white', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 24, marginBottom: 20,
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Loading company profile...
      </div>
    );
  }

  if (error || !data) {
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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20, background: 'none', border: 'none',
          color: '#3b82f6', cursor: 'pointer', fontSize: 14, padding: 0 }}
      >
        ← Back to Search
      </button>

      {/* Header */}
      <div style={{ ...card, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {data.company_name}
            </h1>
            {data.gstn && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>
                GSTIN: {data.gstn}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '10px 18px', backgroundColor: '#fee2e2', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{data.total_invoices}</div>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Invoices</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 18px', backgroundColor: '#fee2e2', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                {formatAmount(data.total_unpaid)}
              </div>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Unpaid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Unpaid Invoices
          {data.invoices.length > 0 && (
            <span style={{
              marginLeft: 10, padding: '2px 10px', backgroundColor: '#fee2e2',
              color: '#991b1b', borderRadius: 12, fontSize: 12, fontWeight: 600,
            }}>
              {data.invoices.length} unpaid
            </span>
          )}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          Invoices reported as unpaid or disputed by FoodLobby members.
        </p>

        {data.invoices.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No invoices on record for this company.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Sr.', 'Invoice Date', 'Due Date', 'Invoice Amount', 'Unpaid Amount', 'Days Overdue', 'Category/Type'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                      color: '#374151', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em', borderBottom: '2px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv, idx) => {
                  const overdue = daysOverdue(inv.due_date);
                  const unpaidAmt = inv.unpaid_amount ?? inv.invoice_amount;
                  return (
                    <tr
                      key={inv.id}
                      style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}
                    >
                      <td style={{ padding: '10px 14px', color: '#6b7280', fontWeight: 500 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {formatDate(inv.due_date)}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatAmount(inv.invoice_amount)}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>
                          {formatAmount(unpaidAmt)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {overdue !== null ? (
                          <span style={{
                            color: 'white', backgroundColor: '#dc2626',
                            padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                          }}>
                            {overdue} days
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {categoryBadge(inv.category)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Persons */}
      <div style={card}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Known Contact Persons
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          Individuals linked to reported incidents under this company. These persons may operate under other company names — verify before engaging.
        </p>

        {data.contact_persons.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No contact persons on record.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Sr.', 'Name', 'Position', 'Email', 'Phone'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                      color: '#374151', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em', borderBottom: '2px solid #e5e7eb',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.contact_persons.map((cp, idx) => (
                  <tr
                    key={cp.id}
                    style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}
                  >
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 600 }}>{cp.name}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{cp.position || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{cp.email || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{cp.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: 16, padding: '10px 14px', backgroundColor: '#fffbeb',
          border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e',
        }}>
          ⚠️ These contacts may also appear under different company names. Always verify identity through official channels before entering into transactions.
        </div>
      </div>
    </div>
  );
}
