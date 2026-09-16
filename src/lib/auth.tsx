import React, { createContext, useContext, useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import type { CompaniesRow } from '@/lib/db-types'

interface AuthContextValue {
  blinkUser: { id: string; email: string; displayName?: string } | null
  company: CompaniesRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [blinkUser, setBlinkUser] = useState<{ id: string; email: string; displayName?: string } | null>(null)
  const [company, setCompany] = useState<CompaniesRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      // Use state.isLoading to distinguish initializing from signed out
      if (state.isLoading) {
        setLoading(true)
        return
      }

      if (state.user) {
        setBlinkUser({
          id: state.user.id,
          email: state.user.email,
          displayName: state.user.displayName,
        })
        // Load company for this user
        loadCompanyForUser(state.user.id)
      } else {
        setBlinkUser(null)
        setCompany(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadCompanyForUser = async (userId: string) => {
    try {
      const companies = await blink.db.table('companies').list()
      setCompany(companies.find(c => c.ownerUserId === userId) || null)
    } catch (error) {
      console.error('Error fetching company data:', error)
      setCompany(null)
    }
  }

  const signOut = async () => {
    await blink.auth.signOut()
    setBlinkUser(null)
    setCompany(null)
  }

  const refreshCompany = async () => {
    if (blinkUser) {
      await loadCompanyForUser(blinkUser.id)
    }
  }

  return (
    <AuthContext.Provider value={{ blinkUser, company, loading, signOut, refreshCompany }}>
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
  const { blinkUser, company, loading } = useAuth()
  
  if (loading) {
    return { blinkUser: null, company: null, loading: true, authenticated: false }
  }
  
  if (!blinkUser) {
    return { blinkUser: null, company: null, loading: false, authenticated: false }
  }
  
  if (!company) {
    return { blinkUser, company: null, loading: false, authenticated: false }
  }
  
  return { blinkUser, company, loading: false, authenticated: true }
}
