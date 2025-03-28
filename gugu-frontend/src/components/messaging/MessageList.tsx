import { useState } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to determine if a user is online (active in the last 5 minutes)
const isUserOnline = (lastActive?: string): boolean => {
  if (!lastActive) return false;
  
  const lastActiveTime = new Date(lastActive).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return currentTime - lastActiveTime < fiveMinutesInMs;
};

// Helper function to format last active time
const formatLastActive = (lastActive?: string): string => {
  if (!lastActive) return '';
  
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

const MessageList = () => {
  const { conversations, loading, error, setCurrentConversation, unreadCount } = useMessaging();
  const { role } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredConversations = filter === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.unread_count && conv.unread_count > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Messages {unreadCount > 0 && <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'unread' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Unread
          </button>
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No messages found</p>
          <p className="text-sm mt-2">Your conversations will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {filteredConversations.map((conversation) => {
            const otherPerson = role === UserRole.Employer 
              ? conversation.worker 
              : conversation.employer;
            
            return (
              <div 
                key={conversation.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${conversation.unread_count ? 'bg-blue-50/70' : ''} hover:shadow-sm transform hover:-translate-y-0.5`}
                onClick={() => setCurrentConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 relative">
                    {otherPerson?.photo_url ? (
                      <img 
                        src={otherPerson.photo_url} 
                        alt={otherPerson.full_name} 
                        className="h-10 w-10 rounded-full shadow-sm border border-gray-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center shadow-sm">
                        <span className="text-white font-medium">
                          {otherPerson?.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Enhanced Online status indicator */}
                    {otherPerson?.last_active && (
                      <div 
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isUserOnline(otherPerson.last_active) ? 'bg-green-500' : 'bg-gray-400'}`}
                        title={isUserOnline(otherPerson.last_active) ? 'Online' : `Last active ${formatLastActive(otherPerson.last_active)}`}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherPerson?.full_name}
                          {role === UserRole.Worker && conversation.employer?.company_name && (
                            <span className="text-gray-500 ml-1">({conversation.employer.company_name})</span>
                          )}
                        </p>
                        {otherPerson?.username && (
                          <p className="text-xs text-gray-500 truncate bg-gray-50 px-1.5 py-0.5 rounded-full inline-block">
                            @{otherPerson.username.replace('.GUGU', '')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </p>
                        {otherPerson?.last_active && (
                          <p className="text-xs text-gray-500">
                            {isUserOnline(otherPerson.last_active) ? (
                              <span className="text-green-500">Online</span>
                            ) : (
                              formatLastActive(otherPerson.last_active)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversation.application && (
                      <p className="text-xs text-gray-500 mt-1">
                        Re: {conversation.application.job?.title || 'Job Application'}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-white mt-1 shadow-sm animate-pulse">
                        {conversation.unread_count} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageList;