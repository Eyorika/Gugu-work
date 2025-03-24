import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Conversation, Message, UserRole } from '../lib/types';

interface MessagingContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => void;
  startConversation: (workerId: string, employerId: string, applicationId?: string) => Promise<string>;
  unreadCount: number;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

   useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          const newMessage = payload.new as Message;
          
           if (currentConversation && newMessage.conversation_id === currentConversation.id) {
            setMessages(prev => [...prev, newMessage]);
          }
          
           fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, currentConversation]);

  // Fetch conversations when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

   useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
      markConversationAsRead(currentConversation.id);
    }
  }, [currentConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          application_id,
          employer_id,
          worker_id,
          last_message,
          last_message_sender_id,
          unread_count,
          employer:profiles!employer_id(id, full_name, company_name, photo_url),
          worker:profiles!worker_id(id, full_name, photo_url),
          application:applications!application_id(id, job_id, status, jobs(id, title))
        `);

      // Filter based on user role
      if (role === UserRole.Employer) {
        query = query.eq('employer_id', user.id);
      } else {
        query = query.eq('worker_id', user.id);
      }

      const { data, error: fetchError } = await query
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Transform the data to match the Conversation interface
      const transformedData = (data || []).map(conv => ({
        ...conv,
        employer: conv.employer?.[0] || null,
        worker: conv.worker?.[0] || null,
        application: conv.application?.[0] || null
      }));

      setConversations(transformedData);
      
      // Calculate total unread count
      const totalUnread = (data || []).reduce((sum, conv) => {
        // Only count messages as unread if they weren't sent by the current user
        const isUnread = role === UserRole.Employer 
          ? conv.unread_count && conv.unread_count > 0 && conv.last_message_sender_id !== user.id
          : conv.unread_count && conv.unread_count > 0 && conv.last_message_sender_id !== user.id;
        
        return sum + (isUnread ? conv.unread_count : 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          read,
          sender:profiles!sender_id(id, full_name, photo_url, role)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform the data to match the Message interface
      const transformedMessages = (data || []).map(msg => ({
        ...msg,
        sender: msg.sender?.[0] || null
      }));

      setMessages(transformedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;
    
    try {
      // Mark all messages in this conversation as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      
      // Update the conversation's unread count
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
      
      // Refresh conversations to update UI
      fetchConversations();
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentConversation) return;
    
    try {
      setError(null);

      // Insert the new message
      const { error: sendError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversation.id,
        sender_id: user.id,
        content,
        created_at: new Date().toISOString(),
        read: false
      });

    if (sendError) throw sendError;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        updated_at: new Date().toISOString(),
        last_message_sender_id: user.id
      })
      .eq('id', currentConversation.id);

    if (updateError) throw updateError;
    } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
  };

  const startConversation = async (workerId: string, employerId: string, applicationId?: string) => {
    try {
      setError(null);

       const { data: existingConversations, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('worker_id', workerId)
        .eq('employer_id', employerId)
        .eq('application_id', applicationId || null);

      if (checkError) throw checkError;

       if (existingConversations && existingConversations.length > 0) {
        return existingConversations[0].id;
      }

       const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          worker_id: workerId,
          employer_id: employerId,
          application_id: applicationId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: 0
        })
        .select('id')
        .single();

      if (createError) throw createError;
      if (!newConversation) throw new Error('Failed to create conversation');

      fetchConversations();
      
      return newConversation.id;
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      return '';
    }
  };

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    sendMessage,
    fetchConversations,
    setCurrentConversation,
    startConversation,
    unreadCount
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}