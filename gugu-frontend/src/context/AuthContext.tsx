import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './SupabaseContext'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  signUp: (data: WorkerSignupData | EmployerSignupData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

interface WorkerSignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  city: string
  skills: string[]
  hourlyRate: number
}

interface EmployerSignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  city: string
  companyName?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const value = {
    user,
    signUp: async (data: WorkerSignupData | EmployerSignupData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'companyName' in data ? 'employer' : 'worker'
          }
        }
      })

      if (error) throw error
      if (!authData.user) throw new Error('Registration failed')

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
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) throw profileError
    },
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      setUser(data.user)
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}