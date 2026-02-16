import React, { useState } from 'react';

interface UserState {
  isLoggedIn: boolean;
  username: string;
}

export default function App(): JSX.Element {
  const [user, setUser] = useState<UserState>({
    isLoggedIn: false,
    username: '',
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    setUser({ isLoggedIn: true, username });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header>
        <h1>Foodlobbyin - B2B Market Insights Platform</h1>
      </header>

      {!user.isLoggedIn ? (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="password"
              placeholder="Password"
              required
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <div style={{ marginTop: '20px' }}>
            <h3>Dashboard</h3>
            <ul>
              <li><a href="#company">Company Profile</a></li>
              <li><a href="#invoices">Manage Invoices</a></li>
              <li><a href="#insights">Market Insights</a></li>
            </ul>
          </div>
          <button
            onClick={() => setUser({ isLoggedIn: false, username: '' })}
            style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
