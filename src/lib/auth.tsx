import React, { createContext, useContext, useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import type { UsersRow, CompaniesRow } from '@/lib/db-types'

interface AuthContextValue {
  user: UsersRow | null
  company: CompaniesRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsersRow | null>(null)
  const [company, setCompany] = useState<CompaniesRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (authState) => {
      if (authState.user) {
        try {
          const userData = await blink.db.table('users').get(authState.user.id)
          setUser(userData || null)

          if (userData) {
            await refreshCompanyForUser(userData.id)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
          setCompany(null)
        }
      } else {
        setUser(null)
        setCompany(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const refreshCompanyForUser = async (userId: string) => {
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
    setUser(null)
    setCompany(null)
  }

  const refreshCompany = async () => {
    if (user) {
      await refreshCompanyForUser(user.id)
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
