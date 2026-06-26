import React, { useState } from 'react';
import { Link, Navigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { Search, MessageSquare, LogOut, User, ClipboardList, Shield, FileText, Settings, KeyRound, BookOpen, BarChart2, Newspaper } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Tabs from '../components/ui/Tabs';
import SearchSubmitSection from '../components/app/SearchSubmitSection';
import DashboardKPIs from '../components/app/DashboardKPIs';
import ForumSection from '../components/app/ForumSection';
import InsiderSection from '../components/app/InsiderSection';
import AuditLogPage from './AuditLogPage';
import ReportIncidentPage from './ReportIncidentPage';
import IncidentDetailPage from './IncidentDetailPage';
import ModerationQueuePage from './ModerationQueuePage';
import MyIncidentsPage from './MyIncidentsPage';
import MyDefaultsPage from './MyDefaultsPage';
import InvoiceCreatePage from './InvoiceCreatePage';
import InvoiceDetailPage from './InvoiceDetailPage';
import InvoiceEditPage from './InvoiceEditPage';
import UserSettingsPage from './UserSettingsPage';

const AUDIT_LOG_TRUST_LEVELS: ReadonlyArray<'moderator' | 'admin'> = ['moderator', 'admin'];

const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const canAccessAuditLogs = !!user?.trust_level && AUDIT_LOG_TRUST_LEVELS.includes(user.trust_level);
  const isModerator = canAccessAuditLogs;
  const isAdmin = user?.trust_level === 'admin';

  // "My Defaults" is visible when the backend confirmed (via the user profile JOIN)
  // that at least one incident exists against this user's company GSTN.
  // The has_incidents flag is returned by GET /api/auth/profile (findById JOIN companies)
  // so no extra API call is needed here.
  const hasIncidentAgainstUser: boolean = !!(user?.has_incidents) || isAdmin;

  const tabs = [
    { id: 'search', label: 'Search', icon: <Search size={18} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 size={18} /> },
    { id: 'forum', label: 'Industry Forum', icon: <MessageSquare size={18} /> },
    { id: 'insider', label: 'Insider', icon: <Newspaper size={18} /> },
    ...(canAccessAuditLogs
      ? [{ id: 'activitylog', label: 'Activity Log', icon: <ClipboardList size={18} /> }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const isDashboard =
    location.pathname === '/app' || location.pathname === '/app/';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <img src="/logo-mark.png" alt="FoodLobby" className="h-9 w-auto" />
              <img src="/logo-wordmark.png" alt="FoodLobby" style={{ height: '22px', width: 'auto' }} />
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center space-x-1 mx-4 flex-1">
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  navLinkClass({ isActive: isActive && isDashboard })
                }
              >
                <Search size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/app/my-incidents" className={navLinkClass}>
                <BookOpen size={16} />
                <span>My Reports</span>
              </NavLink>
              {isModerator && (
                <NavLink to="/app/moderation" className={navLinkClass}>
                  <Shield size={16} />
                  <span>Moderation</span>
                </NavLink>
              )}
              {(hasIncidentAgainstUser || isAdmin) && (
                <NavLink to="/app/defaults" className={navLinkClass}>
                  <FileText size={16} />
                  <span>My Defaults</span>
                </NavLink>
              )}
              {isAdmin && (
                <a
                  href="/admin"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-green-700 hover:bg-green-50 hover:text-green-800 border border-green-200"
                >
                  <Settings size={16} />
                  <span>Admin Panel</span>
                </a>
              )}
            </nav>

            {/* User Menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.first_name || user?.username || 'User'}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name || user?.username}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <a
                          href="/admin"
                          className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center"
                          style={{ display: 'flex', textDecoration: 'none' }}
                        >
                          <Settings size={16} className="mr-2" />
                          Admin Panel
                        </a>
                      )}
                      {isAdmin && (
                        <a
                          href="/admin/profile"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          style={{ display: 'flex', textDecoration: 'none' }}
                        >
                          <KeyRound size={16} className="mr-2" />
                          My Profile
                        </a>
                      )}
                      <Link
                        to="/app/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        style={{ display: 'flex', textDecoration: 'none' }}
                      >
                        <Settings size={16} className="mr-2" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Routes>
          {/* Dashboard (search + forum + audit logs) */}
          <Route
            index
            element={
              <Tabs tabs={tabs}>
                {(activeTab) => (
                  <>
                    {activeTab === 'search' && <SearchSubmitSection />}
                    {activeTab === 'stats' && <DashboardKPIs />}
                    {activeTab === 'forum' && <ForumSection />}
                    {activeTab === 'insider' && <InsiderSection />}
                    {activeTab === 'activitylog' && (
                      canAccessAuditLogs ? <AuditLogPage /> : <Navigate to="/app" replace />
                    )}
                  </>
                )}
              </Tabs>
            }
          />
          {/* Incident report form & detail — accessed from My Reports */}
          <Route path="incidents/new" element={<ReportIncidentPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          {/* My Reports */}
          <Route path="my-incidents" element={<MyIncidentsPage />} />
          {/* My Defaults — private invoice ledger, only for users with incidents against their company */}
          <Route
            path="defaults"
            element={
              (hasIncidentAgainstUser || isAdmin)
                ? <MyDefaultsPage />
                : <Navigate to="/app" replace />
            }
          />
          {/* Invoice create / detail / edit — live inside AppShell so they share the nav header */}
          <Route path="invoices/new" element={<InvoiceCreatePage />} />
          <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          {/* Moderation */}
          <Route
            path="moderation"
            element={
              isModerator ? <ModerationQueuePage /> : <Navigate to="/app" replace />
            }
          />
          {/* User Settings */}
          <Route path="settings" element={<UserSettingsPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppShell;
