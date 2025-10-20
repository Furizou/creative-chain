import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const loadingTimeoutRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return
    initializedRef.current = true

    // Safety timeout: if loading takes more than 5 seconds, force it to false
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('⚠️  Auth initialization timeout - forcing loading to false')
      setLoading(false)
    }, 5000)

    // Fetch user profile data
    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, wallet_address')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return null
        }

        return data
      } catch (error) {
        console.error('Profile fetch error:', error)
        return null
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 useAuth: Checking initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          clearTimeout(loadingTimeoutRef.current)
          return
        }

        if (session?.user) {
          console.log('✅ useAuth: User is authenticated:', session.user.email)
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          console.log('❌ useAuth: No active session')
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
        clearTimeout(loadingTimeoutRef.current)
      } catch (error) {
        console.error('Fatal error in getInitialSession:', error)
        setLoading(false)
        clearTimeout(loadingTimeoutRef.current)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useAuth: Auth state changed:', event)

        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
        }

        // Only set loading to false after initial load
        if (loading) {
          setLoading(false)
          clearTimeout(loadingTimeoutRef.current)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [supabase])

  const signOut = async () => {
    try {
      // Call our logout API instead of direct supabase signout
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Also call supabase signout for client-side cleanup
      await supabase.auth.signOut()
      
      // Reset state
      setUser(null)
      setProfile(null)
      
      // Redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to direct supabase signout
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      window.location.href = '/'
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, wallet_address')
        .eq('id', user.id)
        .single()

      if (!error) {
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