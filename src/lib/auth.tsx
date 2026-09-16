import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { CompaniesRow } from '@/lib/db-types'

interface AuthContextValue {
  user: { id: string; email: string; displayName?: string } | null
  company: CompaniesRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; displayName?: string } | null>(null)
  const [company, setCompany] = useState<CompaniesRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name,
        })
        loadCompanyForUser(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name,
        })
        loadCompanyForUser(session.user.id)
      } else {
        setUser(null)
        setCompany(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCompanyForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('companies(*)')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching company data:', error)
        setCompany(null)
        return
      }

      if (data?.companies) {
        setCompany(data.companies[0] as CompaniesRow)
      } else {
        setCompany(null)
      }
    } catch (error) {
      console.error('Error fetching company data:', error)
      setCompany(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
  }

  const refreshCompany = async () => {
    if (user) {
      await loadCompanyForUser(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, company, loading, signOut, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const { user, company, loading } = useAuth()
  
  if (loading) {
    return { user: null, company: null, loading: true, authenticated: false }
  }
  
  if (!user) {
    return { user: null, company: null, loading: false, authenticated: false }
  }
  
  if (!company) {
    return { user, company: null, loading: false, authenticated: false }
  }
  
  return { user, company, loading: false, authenticated: true }
}
