import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Navigation(): JSX.Element {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navStyle: React.CSSProperties = {
    backgroundColor: '#2c3e50',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  };

  const linkStyle: React.CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    marginRight: '20px',
    padding: '8px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, marginRight: '40px' }}>Foodlobbyin</h2>
        <div>
          <Link to="/" style={linkStyle}>Dashboard</Link>
          <Link to="/company" style={linkStyle}>Company</Link>
          <Link to="/invoices" style={linkStyle}>Invoices</Link>
          <Link to="/insights" style={linkStyle}>Insights</Link>
        </div>
      </div>
      <button onClick={handleLogout} style={buttonStyle}>Logout</button>
    </nav>
  );
}
