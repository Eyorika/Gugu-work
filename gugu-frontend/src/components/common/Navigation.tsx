import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { UserRole } from '../../lib/types';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const employerLinks = [
    { to: '/employer/dashboard', text: 'Dashboard' },
    { to: '/employer/jobs', text: 'Manage Jobs' },
    { to: '/employer/profile', text: 'Profile' },
  ];

  const workerLinks = [
    { to: '/worker/dashboard', text: 'Dashboard' },
    { to: '/worker/profile', text: 'Profile' },
  ];

  if (loading) return null;

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              GUGU
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {(user.user_metadata.role === UserRole.Employer
                  ? employerLinks
                  : workerLinks
                ).map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'text-white bg-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {link.text}
                  </NavLink>
                ))}
                <button
                  onClick={handleSignOut}
                  className="ml-4 text-gray-700 hover:text-indigo-600 text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-white bg-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-white bg-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Sign Up
                </NavLink>
              </>
            )}

            {user && (
              <div className="flex items-center space-x-4">
                <img 
                  src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="pt-2 space-y-1">
              {user ? (
                <>
                  {(user.user_metadata.role === UserRole.Employer
                    ? employerLinks
                    : workerLinks
                  ).map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-base font-medium ${
                          isActive
                            ? 'text-white bg-indigo-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      {link.text}
                    </NavLink>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'text-white bg-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'text-white bg-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    Sign Up
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}