import React, { useState } from 'react';
import { Link, Navigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { Search, MessageSquare, LogOut, User, ClipboardList, AlertTriangle, Shield, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Tabs from '../components/ui/Tabs';
import SearchSubmitSection from '../components/app/SearchSubmitSection';
import ForumSection from '../components/app/ForumSection';
import AuditLogPage from './AuditLogPage';
import IncidentListPage from './IncidentListPage';
import ReportIncidentPage from './ReportIncidentPage';
import IncidentDetailPage from './IncidentDetailPage';
import ModerationQueuePage from './ModerationQueuePage';

const AUDIT_LOG_TRUST_LEVELS: ReadonlyArray<'moderator' | 'admin'> = ['moderator', 'admin'];

const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const canAccessAuditLogs = !!user?.trust_level && AUDIT_LOG_TRUST_LEVELS.includes(user.trust_level);
  const isModerator = canAccessAuditLogs;

  const tabs = [
    { id: 'search', label: 'Search & Submit', icon: <Search size={18} /> },
    { id: 'forum', label: 'Industry Forum', icon: <MessageSquare size={18} /> },
    ...(canAccessAuditLogs
      ? [{ id: 'auditlogs', label: 'Audit Logs', icon: <ClipboardList size={18} /> }]
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

  // Dashboard view is active when not on a sub-route
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Foodlobbyin</span>
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
              <NavLink to="/app/incidents" className={navLinkClass}>
                <AlertTriangle size={16} />
                <span>Incidents</span>
              </NavLink>
              {isModerator && (
                <NavLink to="/app/moderation" className={navLinkClass}>
                  <Shield size={16} />
                  <span>Moderation</span>
                </NavLink>
              )}
            <NavLink to="/app/invoices" className={navLinkClass}>
                <FileText size={16} />
                <span>Invoices</span>
              </NavLink>
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
                      </div>
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
          {/* Dashboard (search, forum, audit logs) */}
          <Route
            index
            element={
              <Tabs tabs={tabs}>
                {(activeTab) => (
                  <>
                    {activeTab === 'search' && <SearchSubmitSection />}
                    {activeTab === 'forum' && <ForumSection />}
                    {activeTab === 'auditlogs' && (
                      canAccessAuditLogs ? <AuditLogPage /> : <Navigate to="/app" replace />
                    )}
                  </>
                )}
              </Tabs>
            }
          />
          {/* Incidents */}
          <Route path="incidents" element={<IncidentListPage />} />
          <Route path="incidents/new" element={<ReportIncidentPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          {/* Moderation */}
          <Route
            path="moderation"
            element={
              isModerator ? <ModerationQueuePage /> : <Navigate to="/app" replace />
            }
          />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppShell;
