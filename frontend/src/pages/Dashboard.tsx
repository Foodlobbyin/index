import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Dashboard(): JSX.Element {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  };

  const linkCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: '#2c3e50',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  };

  return (
    <Layout>
      <div style={cardStyle}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          Welcome, {user.first_name || user.username}!
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
          Manage your company profile, invoices, and view market insights.
        </p>
      </div>

      <div style={gridStyle}>
        <Link to="/company" style={linkCardStyle}>
          <h2 style={{ color: '#3498db', marginBottom: '15px' }}>🏢 Company Profile</h2>
          <p style={{ color: '#7f8c8d' }}>
            Create and manage your company information and business details.
          </p>
        </Link>

        <Link to="/invoices" style={linkCardStyle}>
          <h2 style={{ color: '#27ae60', marginBottom: '15px' }}>📄 Invoices</h2>
          <p style={{ color: '#7f8c8d' }}>
            Add, edit, and manage your invoices. Track payment status and history.
          </p>
        </Link>

        <Link to="/insights" style={linkCardStyle}>
          <h2 style={{ color: '#e67e22', marginBottom: '15px' }}>📊 Market Insights</h2>
          <p style={{ color: '#7f8c8d' }}>
            View industry benchmarks and market data based on aggregated information.
          </p>
        </Link>
      </div>
    </Layout>
  );
}
