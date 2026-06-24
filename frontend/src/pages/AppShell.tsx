import React, { useState } from 'react';
import { Link, Navigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { Search, MessageSquare, LogOut, User, ClipboardList, Shield, FileText, Settings, KeyRound, BookOpen, MapPin, Newspaper } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Tabs from '../components/ui/Tabs';
import SearchSubmitSection from '../components/app/SearchSubmitSection';
import StatesSection from '../components/app/StatesSection';
import ForumSection from '../components/app/ForumSection';
import InsiderSection from '../components/app/InsiderSection';
import AuditLogPage from './AuditLogPage';
import ReportIncidentPage from './ReportIncidentPage';
import IncidentDetailPage from './IncidentDetailPage';
import ModerationQueuePage from './ModerationQueuePage';
import MyIncidentsPage from './MyIncidentsPage';

const AUDIT_LOG_TRUST_LEVELS: ReadonlyArray<'moderator' | 'admin'> = ['moderator', 'admin'];

const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const canAccessAuditLogs = !!user?.trust_level && AUDIT_LOG_TRUST_LEVELS.includes(user.trust_level);
  const isModerator = canAccessAuditLogs;
  const isAdmin = user?.trust_level === 'admin';

  const tabs = [
    { id: 'search', label: 'Search', icon: <Search size={18} /> },
    { id: 'states', label: 'States', icon: <MapPin size={18} /> },
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
              <NavLink to="/app/invoices" className={navLinkClass}>
                <FileText size={16} />
                <span>My Defaults</span>
              </NavLink>
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
                    {activeTab === 'states' && <StatesSection />}
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
