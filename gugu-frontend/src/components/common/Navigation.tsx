import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { FiClock, FiGlobe, FiMenu, FiSearch, FiMoon, FiSun } from 'react-icons/fi';
import { useSidebar } from '../../contexts/SidebarContext';
import { useEffect } from 'react';
import NotificationBell from './NotificationBell';
import { AnimatePresence, motion } from 'framer-motion';
export default function Navigation() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggle } = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setShowMobileFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderAuthButtons = () => (
    <div className="flex items-center space-x-4">
      <NavLink
        to="/login"
        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
      >
        Sign In
      </NavLink>
      <NavLink
        to="/signup"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-sm hover:shadow-md transition-all duration-200"
      >
        Sign Up
      </NavLink>
    </div>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
      {/* Primary Navigation Row */}
      <div className="flex justify-between items-center h-14 px-4 sm:px-6 max-w-[1920px] mx-auto border-b border-gray-100">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center space-x-4">
          {(!user || window.innerWidth < 768) && (
            <button
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                if (user) {
                  toggle();
                } else {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }
              }}
            >
              <FiMenu className="h-5 w-5" />
            </button>
          )}
          <span className="text-xl font-bold text-primary">GUGU</span>
        </div>

        {/* Right Side Icons */}
        {!user ? (
          renderAuthButtons()
        ) : (
          <div className="flex items-center space-x-3">
            <button 
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Recent Activity"
            >
              <FiClock className="h-5 w-5" />
            </button>
            
            <NotificationBell className="text-gray-600" />
            
            <button 
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Language Selector"
            >
              <FiGlobe className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>



      {/* Mobile Menu - Only shown for unauthenticated users */}
      <AnimatePresence>
        {isMobileMenuOpen && !user && (
          <motion.div 
            className="md:hidden pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-2 space-y-1">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function setShowMobileFilters(arg0: boolean) {
  throw new Error('Function not implemented.');
}
