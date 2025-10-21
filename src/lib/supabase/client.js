// Supabase client configuration for browser environment
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid multiple client creations
let browserClient = null

// Clear old localStorage and incompatible cookies from previous auth setup
// Only run this once using sessionStorage flag (don't use localStorage since we're clearing it)
function clearLegacyAuth() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  // Check if we've already cleared legacy auth
  const hasCleared = sessionStorage.getItem('supabase-legacy-auth-cleared')
  if (hasCleared === 'true') return

  // Clear all localStorage items related to Supabase
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log(`🧹 Clearing legacy localStorage: ${key}`)
      localStorage.removeItem(key);
    });

    // Clear old auth-helpers cookies
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const cookieStr = cookie.trim()
      const [name, value] = cookieStr.split('=')

      // Clear old auth-helpers cookies (they have a different format)
      if (name.startsWith('sb-') && value && value.startsWith('base64-')) {
        console.log(`🧹 Clearing legacy cookie: ${name}`)
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })

    console.log('✅ Legacy auth cleared - ready to use cookie-based auth')
    sessionStorage.setItem('supabase-legacy-auth-cleared', 'true')
  } catch (error) {
    console.error('❌ Error clearing legacy auth:', error)
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

  // Clear legacy auth on first load
  clearLegacyAuth()

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

  console.log('✅ Supabase client: Creating real Supabase client with @supabase/ssr')

  // Import createBrowserClient from @supabase/ssr for better Next.js integration
  const { createBrowserClient } = require('@supabase/ssr')

  // Create and cache the browser client using @supabase/ssr
  // This uses cookies by default which works better with Next.js middleware
  try {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return undefined;
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
              return decodeURIComponent(cookieValue);
            }
          }
          return undefined;
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`;
          }
          if (options?.path) {
            cookieString += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`;
          }
          if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookieString += '; secure';
          }
          document.cookie = cookieString;
        },
        remove(name, options) {
          if (typeof document === 'undefined') return;
          this.set(name, '', { ...options, maxAge: 0 });
        },
      },
    })

    console.log('✅ Supabase client created successfully with cookie-based storage')
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }

  return browserClient
}

// Legacy export for backward compatibility
export const supabase = createClient();
