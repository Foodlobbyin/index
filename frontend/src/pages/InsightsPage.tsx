import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { invoiceService, MarketInsights } from '../services/invoiceService';

export default function InsightsPage(): JSX.Element {
  const [insights, setInsights] = useState<MarketInsights[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async (industry?: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getMarketInsights(industry);
      setInsights(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load market insights');
    } finally {
      setLoading(false);
    }
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(industry);
    fetchInsights(industry || undefined);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
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

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#ecf0f1',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginRight: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate aggregate stats
  const totalDataPoints = insights.reduce((sum, insight) => sum + insight.data_points, 0);
  const totalRevenue = insights.reduce((sum, insight) => sum + insight.avg_revenue * insight.data_points, 0);
  const totalInvoiced = insights.reduce((sum, insight) => sum + insight.total_invoiced, 0);

  return (
    <Layout>
      <div style={cardStyle}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>Market Insights</h1>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          View industry benchmarks and market data based on aggregated information
        </p>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Filter by industry (e.g., Technology, Food)"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            style={inputStyle}
          />
          <button onClick={() => handleIndustryFilter(selectedIndustry)} style={buttonStyle}>
            Filter
          </button>
          {selectedIndustry && (
            <button
              onClick={() => {
                setSelectedIndustry('');
                fetchInsights();
              }}
              style={{ ...buttonStyle, backgroundColor: '#95a5a6', marginLeft: '10px' }}
            >
              Clear Filter
            </button>
          )}
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <p>Loading insights...</p>
        ) : insights.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            No market insights available yet. Add company profiles and invoices to see insights.
          </p>
        ) : (
          <>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <h3 style={{ color: '#3498db', margin: '0 0 10px 0', fontSize: '32px' }}>
                  {insights.length}
                </h3>
                <p style={{ color: '#7f8c8d', margin: 0 }}>Industries</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ color: '#27ae60', margin: '0 0 10px 0', fontSize: '32px' }}>
                  {formatNumber(totalDataPoints)}
                </h3>
                <p style={{ color: '#7f8c8d', margin: 0 }}>Companies</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ color: '#e67e22', margin: '0 0 10px 0', fontSize: '32px' }}>
                  {formatCurrency(totalRevenue)}
                </h3>
                <p style={{ color: '#7f8c8d', margin: 0 }}>Total Revenue</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ color: '#9b59b6', margin: '0 0 10px 0', fontSize: '32px' }}>
                  {formatCurrency(totalInvoiced)}
                </h3>
                <p style={{ color: '#7f8c8d', margin: 0 }}>Total Invoiced</p>
              </div>
            </div>

            <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>
              Industry Breakdown
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Industry</th>
                    <th style={thStyle}>Companies</th>
                    <th style={thStyle}>Avg Revenue</th>
                    <th style={thStyle}>Avg Employees</th>
                    <th style={thStyle}>Total Invoiced</th>
                    <th style={thStyle}>Avg Invoice Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.map((insight, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        <strong>{insight.industry || 'Not Specified'}</strong>
                      </td>
                      <td style={tdStyle}>{formatNumber(insight.data_points)}</td>
                      <td style={tdStyle}>{formatCurrency(insight.avg_revenue)}</td>
                      <td style={tdStyle}>{formatNumber(Math.round(insight.avg_employees))}</td>
                      <td style={tdStyle}>{formatCurrency(insight.total_invoiced)}</td>
                      <td style={tdStyle}>
                        {insight.avg_invoice_amount
                          ? formatCurrency(insight.avg_invoice_amount)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>About Market Insights</h3>
              <p style={{ color: '#7f8c8d', margin: '0 0 10px 0' }}>
                Market insights are calculated based on aggregated data from all companies and invoices in the platform.
              </p>
              <ul style={{ color: '#7f8c8d', marginLeft: '20px' }}>
                <li>Data is anonymized and aggregated by industry</li>
                <li>Averages are calculated across all companies in each industry</li>
                <li>Total invoiced represents the sum of all invoice amounts</li>
                <li>This data helps you benchmark your company against industry standards</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
