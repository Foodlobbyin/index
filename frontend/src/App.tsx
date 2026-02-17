import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import InvoiceList from './pages/InvoiceList';
import InsightsPage from './pages/InsightsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';

export default function App(): JSX.Element {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company"
          element={
            <ProtectedRoute>
              <CompanyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <InsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            authService.isAuthenticated() ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
