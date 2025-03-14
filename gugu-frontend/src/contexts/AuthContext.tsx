import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../lib/types';


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
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);

           const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setRole(profile?.role === 'employer' ? UserRole.Employer : UserRole.Worker);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Session error:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          
          setUser(session.user);
           const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setRole(profile?.role === 'employer' ? UserRole.Employer : UserRole.Worker);
        } else {
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
    signUp: async (data: WorkerSignupData | EmployerSignupData) => {
      const userRole = 'companyName' in data ? UserRole.Employer : UserRole.Worker;
      
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
      
      // Redirect based on role
      navigate(userRole === UserRole.Employer ? '/employer/dashboard' : '/worker/dashboard');
    },
    
    signIn: async (email: string, password: string) => {
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
      
      setUser(data.user);
      setRole(userRole);
      
      // Navigate based on role
      navigate(userRole === UserRole.Employer ? '/employer/dashboard' : '/worker/dashboard');
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider value={value}>
    {loading ? <div>Loading...</div> : children}
  </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};