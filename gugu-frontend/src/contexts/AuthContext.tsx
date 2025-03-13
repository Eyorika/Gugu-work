import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../lib/types';

// Define interfaces at the top level
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
=======
import { UserRole } from '../lib/types';

type AuthContextType = {
  user: User | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session:', session); // Debug log
        if (error) throw error;
        setUser(session?.user ?? null);
        setRole(session?.user?.user_metadata?.role ?? null);
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        setLoading(false); // Ensure loading always stops
      }
    };
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', session); // Debug log
        setUser(session?.user ?? null);
        setRole(session?.user?.user_metadata?.role ?? null);
      }
    );
  
    getSession();
    return () => subscription?.unsubscribe();
  }, []);

  const value = {
    user,
    role,
    signUp: async (data: WorkerSignupData | EmployerSignupData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'companyName' in data ? 'employer' : 'worker',
            redirectTo: `${window.location.origin}/dashboard`
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
        role: 'companyName' in data ? 'employer' : 'worker',
        ...('companyName' in data && { company_name: data.companyName }),
        ...('skills' in data && { 
          skills: data.skills,
          hourly_rate: data.hourlyRate
        })
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) throw profileError;

      // Redirect based on role
      const role = 'companyName' in data ? 'employer' : 'worker';
      navigate(role === 'employer' ? '/employer-dashboard' : '/worker-dashboard');
    },
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      setUser(data.user);
      navigate(data.user.user_metadata?.role === 'employer' ? '/employer-dashboard' : '/worker-dashboard');
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
=======

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    setUser(data.user);
    setRole(data.user.user_metadata?.role || null);
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });

    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      setRole(role);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
