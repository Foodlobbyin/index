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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Foodlobbyin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') ? 'text-blue-600' : 'text-gray-700'
                } hover:text-blue-600 transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/news"
                className={`${
                  isActive('/news') ? 'text-blue-600' : 'text-gray-700'
                } hover:text-blue-600 transition-colors`}
              >
                News & Updates
              </Link>
              <Link to="/login">
                <Button>Sign In</Button>
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
                  isActive('/') ? 'text-blue-600' : 'text-gray-700'
                } hover:text-blue-600 transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/news"
                className={`block ${
                  isActive('/news') ? 'text-blue-600' : 'text-gray-700'
                } hover:text-blue-600 transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                News & Updates
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button fullWidth>Sign In</Button>
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
              <h3 className="text-lg font-semibold mb-4">Foodlobbyin</h3>
              <p className="text-gray-400">
                B2B directory and invoice intelligence for the food & spice industry
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-400 hover:text-white transition-colors">
                    News & Updates
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: support@foodlobbyin.com</li>
                <li className="text-gray-400">Phone: +91 1234567890</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Foodlobbyin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
