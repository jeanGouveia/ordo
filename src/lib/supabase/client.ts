import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      )
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// Export as named export for convenience (lazy initialization)
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    return getSupabaseClient()[prop]
  }
})
