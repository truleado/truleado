'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'

declare global {
  interface Window {
    __authContextLogged?: boolean
  }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Early return if Supabase is not configured (during build time)
  if (!supabase || !supabase.auth) {
    return (
      <AuthContext.Provider value={{
        user: null,
        session: null,
        loading: false,
        signIn: async () => ({ error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ error: { message: 'Supabase not configured' } }),
        signInWithGoogle: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => {}
      }}>
        {children}
      </AuthContext.Provider>
    )
  }


  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Auth context error:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        } catch (error) {
          console.error('Auth state change error:', error)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
      
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
        return { 
          error: { 
            message: 'Supabase is not configured. Please check your environment variables.' 
          } 
        }
      }
      
      console.log('🔐 Attempting sign in:', {
        email: normalizedEmail,
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
        hasKey: !!supabaseAnonKey,
        urlValid: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co')
      })
      
      // Test Supabase connectivity first
      try {
        const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        })
        console.log('🌐 Supabase connectivity test:', {
          status: testResponse.status,
          ok: testResponse.ok,
          url: `${supabaseUrl}/rest/v1/`
        })
      } catch (fetchError) {
        console.error('❌ Supabase connectivity test failed:', fetchError)
        return { 
          error: { 
            message: `Cannot connect to Supabase: ${fetchError instanceof Error ? fetchError.message : 'Network error'}. Check your Supabase URL and network connection.` 
          } 
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      
      if (error) {
        console.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
      } else {
        console.log('Sign in successful:', data.user?.id)
      }
      
      return { error }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { 
        error: { 
          message: err instanceof Error ? err.message : 'Failed to sign in. Please check your connection and try again.' 
        } 
      }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    })
    
    // If the user is already registered, attempt to sign them in directly
    if (error && /already registered/i.test(error.message)) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      return { error: signInError || null }
    }
    
    return { error }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      return { error }
    } catch (err) {
      console.error('Google OAuth error:', err)
      return { error: err instanceof Error ? err : new Error('Failed to initiate Google sign-in') }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

