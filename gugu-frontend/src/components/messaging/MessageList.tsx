import { useState, useEffect } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { Conversation, UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

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
                  <div className="flex-shrink-0">
                    {otherPerson?.photo_url ? (
                      <img 
                        src={otherPerson.photo_url} 
                        alt={otherPerson.full_name} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {otherPerson?.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {otherPerson?.full_name}
                        {role === UserRole.Worker && conversation.employer?.company_name && (
                          <span className="text-gray-500 ml-1">({conversation.employer.company_name})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
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