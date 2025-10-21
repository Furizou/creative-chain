// Supabase client configuration for browser environment
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid multiple client creations
let browserClient = null

// Clear old auth-helpers cookies that are incompatible with @supabase/ssr
// Only run this once using localStorage flag
function clearLegacyAuthCookies() {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') return

  // Check if we've already cleared legacy cookies
  const hasCleared = localStorage.getItem('supabase-legacy-cookies-cleared')
  if (hasCleared === 'true') return

  const cookies = document.cookie.split(';')
  let cleared = false

  cookies.forEach(cookie => {
    const cookieStr = cookie.trim()
    const [name, value] = cookieStr.split('=')

    // Only clear cookies that have the old base64- prefix format
    if (name.startsWith('sb-') && value && value.startsWith('base64-')) {
      console.log(`🧹 Clearing legacy cookie: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      cleared = true
    }
  })

  if (cleared) {
    console.log('✅ Legacy auth cookies cleared - please log in again')
    localStorage.setItem('supabase-legacy-cookies-cleared', 'true')
  } else {
    // Mark as cleared even if no cookies found, so we don't check again
    localStorage.setItem('supabase-legacy-cookies-cleared', 'true')
  }
}

export function createClient() {
  // Return existing instance if available (singleton pattern)
  if (browserClient) {
    console.log('🔍 Supabase client: Reusing existing client instance')
    return browserClient
  }

  // Check if we have valid Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Supabase client: Creating new client instance', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl?.substring(0, 20) + '...',
  })

  // Clear legacy cookies on first load
  clearLegacyAuthCookies()

  // If we don't have valid configuration, return a mock client
  if (!supabaseUrl || !supabaseKey ||
      supabaseUrl === 'your_supabase_url_here' ||
      supabaseKey === 'your_supabase_anon_key_here') {

    console.warn('⚠️  Supabase client: Using mock client due to missing/invalid configuration')

    // Return a mock client that won't cause errors (don't cache mock client)
    return {
      auth: {
        getSession: () => {
          console.log('🔍 Mock client: getSession() called')
          return Promise.resolve({ data: { session: null }, error: null })
        },
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => {
          console.log('🔍 Mock client: onAuthStateChange() called')
          return { data: { subscription: { unsubscribe: () => {} } } }
        }
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
      })
    }
  }

  console.log('✅ Supabase client: Creating real Supabase client with @supabase/supabase-js')

  // Create and cache the browser client using standard supabase-js
  // This uses localStorage by default which works better with SSR
  try {
    browserClient = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        storageKey: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Disable URL session detection - might be causing hang
      },
    })

    console.log('✅ Supabase client created successfully')
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }

  return browserClient
}

// Legacy export for backward compatibility
export const supabase = createClient();