import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Create client once and memoize it
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔍 useAuth: Initializing auth...')

        // Try localStorage first (faster and more reliable)
        const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
        const authData = localStorage.getItem(storageKey)

        let user = null
        let error = null

        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            console.log('🔍 localStorage auth data structure:', parsed)

            // Try different possible structures
            user = parsed.currentSession?.user ||
                   parsed.user ||
                   parsed.session?.user ||
                   null

            console.log('✅ Loaded user from localStorage:', user?.email || 'NO USER FOUND')
          } catch (e) {
            console.error('Failed to parse localStorage auth data:', e)
          }
        } else {
          console.log('❌ No auth data in localStorage')
        }

        // If we got a user from localStorage, we're done
        // We'll let onAuthStateChange handle any updates
        if (!user) {
          // Only call getUser() if we don't have a user in localStorage
          console.log('No user in localStorage, trying getUser()...')
          try {
            const getUserPromise = supabase.auth.getUser()
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('getUser timeout')), 2000)
            )

            const result = await Promise.race([getUserPromise, timeoutPromise])
            user = result.data?.user
            error = result.error
          } catch (timeoutError) {
            console.warn('⚠️ getUser() timed out')
          }
        }

        console.log('🔍 useAuth: User result:', { user, error })

        if (user) {
          console.log('✅ useAuth: User authenticated:', user.email)
          setUser(user)

          // Fetch profile with timeout - use direct REST API call
          try {
            console.log('🔍 Fetching profile for user:', user.id)

            // Get the access token from localStorage
            const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
            const authData = localStorage.getItem(storageKey)
            const accessToken = authData ? JSON.parse(authData).access_token : null

            const profilePromise = fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=id,username,full_name,avatar_url,wallet_address`,
              {
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${accessToken || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                }
              }
            ).then(res => res.json())

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            )

            const profileData = await Promise.race([
              profilePromise,
              timeoutPromise
            ])

            console.log('🔍 Profile API response:', profileData)

            if (profileData && profileData.length > 0) {
              console.log('✅ useAuth: Profile loaded:', profileData[0])
              setProfile(profileData[0])
            } else {
              console.warn('⚠️ useAuth: No profile found for user', {
                hasData: !!profileData,
                isArray: Array.isArray(profileData),
                length: profileData?.length,
                data: profileData
              })
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

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, 'Session:', session)

      if (session?.user) {
        console.log('✅ onAuthStateChange: User logged in:', session.user.email)
        setUser(session.user)

        // Fetch profile when user logs in with timeout - use direct REST API call
        try {
          console.log('🔍 onAuthStateChange: Fetching profile for user:', session.user.id)

          const profilePromise = fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=id,username,full_name,avatar_url,wallet_address`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          ).then(res => res.json())

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          )

          const profileData = await Promise.race([
            profilePromise,
            timeoutPromise
          ])

          if (profileData && profileData.length > 0) {
            console.log('✅ onAuthStateChange: Profile loaded:', profileData[0])
            setProfile(profileData[0])
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
      if (timeout) clearTimeout(timeout)
    }
  }, [supabase])

  const signOut = async () => {
    try {
      console.log('🔍 Signing out...')

      // Clear localStorage directly (more reliable than waiting for supabase.auth.signOut)
      const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
      localStorage.removeItem(storageKey)

      // Try to call signOut with timeout (in case it hangs)
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000))
      await Promise.race([signOutPromise, timeoutPromise])

      console.log('✅ Signed out successfully')
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
