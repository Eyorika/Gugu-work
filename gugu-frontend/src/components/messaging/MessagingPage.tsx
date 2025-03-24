import { useState } from 'react';
import MessageList from './MessageList';
import ChatInterface from './ChatInterface';
import { useMessaging } from '../../contexts/MessagingContext';

const MessagingPage = () => {
  const { currentConversation } = useMessaging();

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700 drop-shadow-sm flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Messages
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/30 p-2 rounded-xl shadow-sm backdrop-blur-sm">
        <div className="md:col-span-1">
          <MessageList />
        </div>
        <div className="md:col-span-2 h-[calc(100vh-12rem)] md:h-[600px]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;