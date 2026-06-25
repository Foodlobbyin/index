import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import PendingReviewPage from './pages/PendingReviewPage';
import Homepage from './pages/Homepage';
import NewsPage from './pages/NewsPage';
import PublicLayout from './components/PublicLayout';
import AppShell from './pages/AppShell';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import CompanyView from './pages/CompanyView';
import ContactPersonPage from './pages/ContactPersonPage';
import InsightsPage from './pages/InsightsPage';
import AdminPanel from './pages/admin/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public pages with navbar */}
          <Route path="/" element={<PublicLayout><Homepage /></PublicLayout>} />
          <Route path="/news" element={<PublicLayout><NewsPage /></PublicLayout>} />

          {/* Auth pages without navbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/pending-review" element={<PendingReviewPage />} />

          {/* Admin panel — auth check is done inside AdminPanel itself */}
          <Route path="/admin/*" element={<AdminPanel />} />

          {/* Protected standalone pages (linked from Dashboard) */}
          <Route
            path="/dashboard"
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
            path="/company/view/gstn/:gstn"
            element={
              <ProtectedRoute>
                <CompanyView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/view/name/:name"
            element={
              <ProtectedRoute>
                <CompanyView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact/:id"
            element={
              <ProtectedRoute>
                <ContactPersonPage />
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

          {/* /app/invoices redirects to /app/defaults — all invoice sub-routes are handled inside AppShell */}
          <Route path="/app/invoices" element={<Navigate to="/app/defaults" replace />} />

          {/* Protected app shell (catch-all for /app/*) — handles /app/defaults, /app/invoices/:id, etc. */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
