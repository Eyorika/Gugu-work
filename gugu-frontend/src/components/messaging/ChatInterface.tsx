import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to determine if a user is online (active in the last 5 minutes)
const isUserOnline = (lastActive: string): boolean => {
  const lastActiveTime = new Date(lastActive).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return currentTime - lastActiveTime < fiveMinutesInMs;
};

// Helper function to format last active time
const formatLastActive = (lastActive: string): string => {
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return lastActiveDate.toLocaleDateString();
};

const ChatInterface = () => {
  const { currentConversation, messages, loading, error, sendMessage } = useMessaging();
  const { user, role } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!currentConversation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col justify-center items-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg">Select a conversation to start messaging</p>
      </div>
    );
  }

  const otherPerson = role === UserRole.Employer 
    ? currentConversation.worker 
    : currentConversation.employer;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      {/* Enhanced Chat Header with User Profile */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4 relative">
            {otherPerson?.photo_url ? (
              <img 
                src={otherPerson.photo_url} 
                alt={otherPerson.full_name} 
                className="h-12 w-12 rounded-full shadow-md border-2 border-white"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center shadow-md">
                <span className="text-white font-medium text-lg">
                  {otherPerson?.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Enhanced Online status indicator */}
            {otherPerson?.last_active && (
              <div 
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${isUserOnline(otherPerson.last_active) ? 'bg-green-500' : 'bg-gray-400'}`}
                title={isUserOnline(otherPerson.last_active) ? 'Online' : `Last active ${formatLastActive(otherPerson.last_active)}`}
              ></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {otherPerson?.full_name}
                {role === UserRole.Worker && currentConversation.employer?.company_name && (
                  <span className="text-gray-500 ml-1 text-sm">({currentConversation.employer.company_name})</span>
                )}
              </h2>
              {otherPerson?.last_active && (
                <span className={`text-xs px-2 py-1 rounded-full ${isUserOnline(otherPerson.last_active) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {isUserOnline(otherPerson.last_active) ? 'Online' : `Last active ${formatLastActive(otherPerson.last_active)}`}
                </span>
              )}
            </div>
            <div className="flex items-center mt-1">
              {otherPerson?.username && (
                <p className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  @{otherPerson.username.replace('.GUGU', '')}
                </p>
              )}
              {currentConversation.application && (
                <p className="text-xs text-gray-500 ml-2">
                  • Re: {currentConversation.application.job?.title || 'Job Application'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 bg-opacity-60 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === user?.id;
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in-up`}
              >
                <div className={`max-w-[75%] rounded-lg px-4 py-3 ${isCurrentUser ? 'bg-primary text-white rounded-tr-none shadow-md hover:shadow-lg transition-shadow duration-200' : 'bg-white rounded-tl-none shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200'}`}>
                  <div className="flex items-center mb-1">
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        {message.sender?.photo_url ? (
                          <img 
                            src={message.sender.photo_url} 
                            alt={message.sender.full_name} 
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {message.sender?.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <span className={`text-xs font-medium ${isCurrentUser ? 'text-white/90' : 'text-gray-600'}`}>
                      {isCurrentUser ? 'You' : message.sender?.full_name} <span className={`${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>• {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
        <div className="flex space-x-3 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;