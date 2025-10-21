import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Create client once and memoize it (uses cookie-based auth)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Get initial session using NEW cookie-based auth
    const initializeAuth = async () => {
      try {
        console.log('🔍 useAuth: Initializing auth with cookie-based client...')

        // First check if there's a session (to avoid "session missing" errors)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.log('🔍 useAuth: No active session found')
          setLoading(false)
          return
        }

        // If there's a session, get the user details
        const { data: { user }, error } = await supabase.auth.getUser()

        console.log('🔍 useAuth: User result:', { user: user?.email, error })

        if (error) {
          // Only log non-session errors
          if (error.name !== 'AuthSessionMissingError') {
            console.error('❌ useAuth: Error getting user:', error)
          }
        }

        if (user) {
          console.log('✅ useAuth: User authenticated:', user.email)
          setUser(user)

          // Fetch profile using Supabase client (not REST API)
          try {
            console.log('🔍 useAuth: Fetching profile for user:', user.id)

            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, wallet_address')
              .eq('id', user.id)
              .single()

            if (profileError) {
              console.error('❌ useAuth: Profile fetch error:', profileError)
            } else if (profileData) {
              console.log('✅ useAuth: Profile loaded:', profileData)
              setProfile(profileData)
            } else {
              console.warn('⚠️ useAuth: No profile found for user')
            }
          } catch (error) {
            console.error('❌ useAuth: Profile fetch failed:', error)
            // Continue without profile - user is still authenticated
          }
        } else {
          console.log('❌ useAuth: No user found')
        }
      } catch (error) {
        console.error('❌ useAuth: Error initializing auth:', error)
      } finally {
        console.log('✅ useAuth: Setting loading to false')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes (login/logout) using cookie-based auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, 'Session:', !!session)

      if (session?.user) {
        console.log('✅ onAuthStateChange: User logged in:', session.user.email)
        setUser(session.user)

        // Fetch profile when user logs in using Supabase client
        try {
          console.log('🔍 onAuthStateChange: Fetching profile for user:', session.user.id)

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, wallet_address')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.error('❌ onAuthStateChange: Profile fetch error:', profileError)
          } else if (profileData) {
            console.log('✅ onAuthStateChange: Profile loaded:', profileData)
            setProfile(profileData)
          } else {
            console.warn('⚠️ onAuthStateChange: No profile found for user')
          }
        } catch (error) {
          console.error('❌ onAuthStateChange: Profile fetch failed:', error)
          // Continue without profile - user is still authenticated
        }
      } else {
        console.log('❌ onAuthStateChange: User logged out or no session')
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      console.log('🔍 Signing out...')

      // Use cookie-based signOut (will clear cookies automatically)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Sign out error:', error)
      } else {
        console.log('✅ Signed out successfully')
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
    } finally {
      // Always clear state and redirect regardless of whether signOut succeeded
      setUser(null)
      setProfile(null)
      window.location.href = '/'
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, wallet_address')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      }
    }
  }

  return {
    user,
    profile,
    loading,
    supabase,
    signOut,
    refreshProfile,
    isAuthenticated: !!user
  }
}
