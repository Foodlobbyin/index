import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ContactPerson {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  company: string | null;
  company_gstn: string | null;
  canonical_phone: string | null;
  canonical_email: string | null;
}

interface CompanyStat {
  company_name: string;
  company_gstn: string | null;
  incident_count: number;
  total_invoice_amount: number;
  total_unpaid: number;
}

interface ContactProfileData {
  person: ContactPerson;
  companies: CompanyStat[];
}

function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number(amount) === 0) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function ContactPersonPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ContactProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError('No contact ID.'); setLoading(false); return; }
    api.get(`/contact/${id}`)
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || 'Contact person not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const card: React.CSSProperties = {
    backgroundColor: 'white', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 24, marginBottom: 20,
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading contact profile...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: 16, marginBottom: 16 }}>{error || 'Not found.'}</p>
        <button onClick={() => navigate(-1)}
          style={{ padding: '8px 20px', borderRadius: 7, border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}>
          ← Go Back
        </button>
      </div>
    );
  }

  const { person, companies } = data;
  const totalUnpaid = companies.reduce((s, c) => s + Number(c.total_unpaid), 0);
  const totalIncidents = companies.reduce((s, c) => s + c.incident_count, 0);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>
      <button onClick={() => navigate(-1)}
        style={{ marginBottom: 20, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, padding: 0 }}>
        ← Back to Search
      </button>

      {/* Header card */}
      <div style={{ ...card, backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>{person.name}</h1>
            {person.position && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{person.position}</p>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {person.phone && (
                <span style={{ fontSize: 13, color: '#374151' }}>
                  📞 {person.phone}
                </span>
              )}
              {person.email && (
                <span style={{ fontSize: 13, color: '#374151' }}>
                  ✉️ {person.email}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', backgroundColor: '#fee2e2', borderRadius: 10 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>{totalIncidents}</div>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Incidents</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', backgroundColor: '#fee2e2', borderRadius: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{formatAmount(totalUnpaid)}</div>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Unpaid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div style={{
        padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400e',
      }}>
        ⚠️ This person has been linked to incidents across <strong>{companies.length}</strong> {companies.length === 1 ? 'company' : 'companies'}.
        They may operate under different company names. Always verify before engaging in any transaction.
      </div>

      {/* Companies table */}
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Companies Linked to This Person
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          Click a company GSTIN to view full invoice details reported against that company.
        </p>

        {companies.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No company data available.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Sr.', 'Company Name', 'GSTIN', 'Incidents', 'Total Invoice Amount', 'Total Unpaid'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                      color: '#374151', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((co, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 600 }}>
                      {co.company_gstn ? (
                        <a
                          href={`/company/view/gstn/${encodeURIComponent(co.company_gstn)}`}
                          style={{ color: '#2563eb', textDecoration: 'none' }}
                        >
                          {co.company_name}
                        </a>
                      ) : (
                        <a
                          href={`/company/view/name/${encodeURIComponent(co.company_name)}`}
                          style={{ color: '#2563eb', textDecoration: 'none' }}
                        >
                          {co.company_name}
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#6b7280', fontSize: 12 }}>
                      {co.company_gstn || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#111827', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', backgroundColor: '#fee2e2',
                        color: '#991b1b', borderRadius: 12, fontWeight: 700, fontSize: 12,
                      }}>
                        {co.incident_count}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatAmount(co.total_invoice_amount)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {Number(co.total_unpaid) > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>
                          {formatAmount(co.total_unpaid)}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
