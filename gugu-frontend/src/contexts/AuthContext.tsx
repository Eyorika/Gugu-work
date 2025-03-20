import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/types';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface WorkerSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string;
  skills: string[];
  hourlyRate: number;
}

interface EmployerSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string;
  companyName: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (data: WorkerSignupData | EmployerSignupData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('AuthProvider - Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider - Session error:', error);
          throw error;
        }
        
        console.log('AuthProvider - Session:', session);
        if (session?.user) {
          console.log('AuthProvider - User found:', session.user.email);
          setUser(session.user);

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('AuthProvider - Profile fetch error:', profileError);
            throw profileError;
          }
          
          console.log('AuthProvider - Profile:', profile);
          const userRole = profile?.role === 'employer' ? UserRole.Employer : UserRole.Worker;
          console.log('AuthProvider - Setting role:', userRole);
          setRole(userRole);
        } else {
          console.log('AuthProvider - No session found');
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('AuthProvider - Error:', error);
        setUser(null);
        setRole(null);
      } finally {
        console.log('AuthProvider - Setting loading to false');
        setLoading(false);
      }
    };
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthProvider - Auth state changed:', _event);
        if (session?.user) {
          console.log('AuthProvider - New user:', session.user.email);
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          const userRole = profile?.role === 'employer' ? UserRole.Employer : UserRole.Worker;
          console.log('AuthProvider - Setting role from auth state change:', userRole);
          setRole(userRole);
        } else {
          console.log('AuthProvider - User signed out');
          setUser(null);
          setRole(null);
        }
      }
    );
  
    getSession();
    return () => subscription?.unsubscribe();
  }, []);

  const value = {
    user,
    role,
    loading,
    signUp: async (data: WorkerSignupData | EmployerSignupData) => {
      const userRole = 'companyName' in data ? UserRole.Employer : UserRole.Worker;
      console.log('AuthProvider - Signing up with role:', userRole);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: userRole,
            firstName: data.firstName,
            lastName: data.lastName
          }
        }
      });

      if (error) throw error;
      if (!authData.user) throw new Error('Registration failed');

      const profileData = {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        city: data.city,
        role: userRole,
        ...('companyName' in data && { company_name: data.companyName }),
        ...('skills' in data && { 
          skills: data.skills,
          hourly_rate: data.hourlyRate
        })
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);
    
      if (profileError) throw profileError;
      
      // Set role immediately after successful signup
      setRole(userRole);
      console.log('AuthProvider - Signup successful, navigating to:', userRole === UserRole.Employer ? '/employer/dashboard' : '/worker/dashboard');
      
      // Redirect based on role
      navigate(userRole === UserRole.Employer ? '/employer/dashboard' : '/worker/dashboard');
    },
    
    signIn: async (email: string, password: string) => {
      console.log('AuthProvider - Attempting sign in');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      const userRole = profile?.role === 'employer' ? UserRole.Employer : UserRole.Worker;
      console.log('AuthProvider - Sign in successful, role:', userRole);
      
      setUser(data.user);
      setRole(userRole);
      
      // Navigate based on role
      navigate(userRole === UserRole.Employer ? '/employer/dashboard' : '/worker/dashboard');
    },
    signOut: async () => {
      console.log('AuthProvider - Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRole(null);
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading...</p>
          <span className="sr-only">Content is loading...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}