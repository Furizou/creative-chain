import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    }

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
          return
        }

        setProfile(data)
      } catch (error) {
        console.error('Profile fetch error:', error)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
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