import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { UserRole } from '../../lib/types';
import { FiHome, FiList, FiUser, FiMessageCircle, FiLogOut, FiSettings, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../../contexts/SidebarContext';
import { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip'; // Assume you have a Tooltip component

const sidebarVariants = {
  open: { width: "260px" },
  collapsed: { width: "80px" }
};

const linkVariants = {
  open: { opacity: 1, x: 0 },
  collapsed: { opacity: 0, x: -20 }
};

export default function Sidebar() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useMessaging();
  const { isCollapsed, toggle } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const employerLinks = [
    { to: '/employer/dashboard', text: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { to: '/employer/jobs', text: 'Manage Jobs', icon: <FiList className="w-5 h-5" /> },
    { to: '/employer/messages', text: 'Messages', icon: <FiMessageCircle className="w-5 h-5" />, badge: unreadCount },
    { to: '/employer/profile', text: 'My Profile', icon: <FiUser className="w-5 h-5" /> },
  ];

  const workerLinks = [
    { to: '/worker/dashboard', text: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { to: '/worker/applications', text: 'Applications', icon: <FiList className="w-5 h-5" /> },
    { to: '/worker/messages', text: 'Messages', icon: <FiMessageCircle className="w-5 h-5" />, badge: unreadCount },
    { to: '/worker/profile', text: 'My Profile', icon: <FiUser className="w-5 h-5" /> },
  ];

  if (loading) {
    return null;
  }

  if (!user) {
    return <div className="hidden md:block w-16 lg:w-64" />;
  }

  const links = role === UserRole.Employer ? employerLinks : workerLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isHovered && isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-10 md:hidden"
          onClick={() => setIsHovered(false)}
        />
      )}

      <motion.div
        initial={isCollapsed ? "collapsed" : "open"}
        animate={isCollapsed ? "collapsed" : "open"}
        variants={sidebarVariants}
        className={`fixed md:relative h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-lg ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <img
              src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=004AAD&color=fff`}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {links.map((link) => (
              <li key={link.to}>
                <Tooltip content={link.text} position="right" disabled={!isCollapsed}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="flex-shrink-0 relative">
                      {link.icon}
                      {link.badge && link.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </span>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="ml-3"
                        >
                          {link.text}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-100">
          <ul className="space-y-1">
            <li>
              <Tooltip content="Settings" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <FiSettings className="w-5 h-5" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3"
                      >
                        Settings
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </Tooltip>
            </li>
            <li>
              <Tooltip content="Log out" position="right" disabled={!isCollapsed}>
                <button
                  onClick={handleSignOut}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 w-full transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiLogOut className="w-5 h-5" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3"
                      >
                        Log out
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Tooltip>
            </li>
          </ul>
        </div>

        {/* Collapse Toggle Button - Centered */}
        <button
          onClick={toggle}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? (
              <FiChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <FiChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </motion.div>
        </button>

        {/* Expanded View on Hover */}
        <AnimatePresence>
          {isHovered && isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-xl py-2 px-3 w-64 z-30"
            >
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=004AAD&color=fff`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <ul className="py-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      onClick={() => setIsHovered(false)}
                    >
                      <span className="mr-3">{link.icon}</span>
                      <span>{link.text}</span>
                      {link.badge && link.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}