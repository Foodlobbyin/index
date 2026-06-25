import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from './ui/Button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo-mark.png" alt="FoodLobby" className="h-10 w-auto" />
              <img src="/logo-wordmark.png" alt="FoodLobby" className="h-7 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') ? 'text-green-700 font-semibold' : 'text-gray-700'
                } hover:text-green-700 transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/news"
                className={`${
                  isActive('/news') ? 'text-green-700 font-semibold' : 'text-gray-700'
                } hover:text-green-700 transition-colors`}
              >
                Alerts & Updates
              </Link>
              <Link to="/login">
                <Button className="bg-green-700 hover:bg-green-800 text-white">
                  Member Sign In
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <Link
                to="/"
                className={`block ${
                  isActive('/') ? 'text-green-700 font-semibold' : 'text-gray-700'
                } hover:text-green-700 transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/news"
                className={`block ${
                  isActive('/news') ? 'text-green-700 font-semibold' : 'text-gray-700'
                } hover:text-green-700 transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Alerts & Updates
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button fullWidth className="bg-green-700 hover:bg-green-800 text-white">
                  Member Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <img src="/logo-mark.png" alt="FoodLobby" style={{ height: 28, width: 'auto' }} />
                <img src="/logo-wordmark.png" alt="FoodLobby" style={{ height: 20, width: 'auto' }} />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                A community-driven platform to report trade fraud, credit defaults, and
                payment scams in India's food &amp; spice commodity sector.
              </p>
              <p className="text-gray-600 text-xs mt-3">
                Invite-only &middot; Verified members only
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-400 hover:text-white transition-colors">
                    Alerts &amp; Updates
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Member Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-400">Email: support@foodlobby.in</li>
                <li className="text-gray-400">Junagadh, Gujarat, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} FoodLobby. All rights reserved.
              &nbsp;&middot;&nbsp; Protecting India's food &amp; spice trade community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
