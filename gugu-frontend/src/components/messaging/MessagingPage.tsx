import MessageList from './MessageList';
import ChatInterface from './ChatInterface';
import { useMessaging } from '../../contexts/MessagingContext';
import { motion } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';

const MessagingPage = () => {
  const { unreadCount } = useMessaging();

  return (
    <motion.div 
      className="max-w-7xl mx-auto p-6 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1 
        className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700 drop-shadow-sm flex items-center"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <FiMessageCircle className="h-8 w-8 mr-3 text-primary" />
        Messages
        {unreadCount > 0 && (
          <motion.span 
            className="ml-3 bg-red-500 text-white text-sm px-2 py-1 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/30 p-4 rounded-xl shadow-md backdrop-blur-sm border border-gray-100">
        <motion.div 
          className="md:col-span-1"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <MessageList />
        </motion.div>
        <motion.div 
          className="md:col-span-2 h-[calc(100vh-12rem)] md:h-[600px]" 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ChatInterface />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MessagingPage;