import { supabase } from '@/lib/supabase/client'

/**
 * Wait for Supabase auth to finish initializing.
 * Returns when auth state is settled.
 */
export function waitForAuthReady(): Promise<boolean> {
  return new Promise((resolve) => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(!!session?.user)
    })

    // Listen for auth changes to ensure we catch the settled state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      subscription.unsubscribe()
      resolve(!!session?.user)
    })
  })
}

/**
 * Get the current auth user.
 */
export async function getCurrentAuthUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get company for a user ID.
 */
export async function getCompanyForUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('companies(*)')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return null
    }

    return data?.companies || null
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}
