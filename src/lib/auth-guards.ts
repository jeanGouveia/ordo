import { blink } from '@/blink/client'

/**
 * Wait for Blink auth to finish initializing.
 * Returns when state.isLoading becomes false.
 */
export function waitForAuthReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (!state.isLoading) {
        unsubscribe()
        resolve(!!state.user)
      }
    })
  })
}

/**
 * Get the current auth state without waiting.
 * Use this only when you have already waited for initialization.
 */
export function getCurrentAuthUser() {
  return blink.auth.currentUser()
}

/**
 * Get company for a user ID.
 */
export async function getCompanyForUser(userId: string) {
  try {
    const companies = await blink.db.table('companies').list()
    return companies.find(c => c.ownerUserId === userId) || null
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}
