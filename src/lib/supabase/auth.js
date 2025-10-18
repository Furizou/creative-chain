// Authentication helpers for Supabase
import { createClient } from './client'
import { createClient as createServerClient } from './server'

// Client-side auth helpers
export const auth = {
  signUp: async ({ email, password, userData = {} }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // Additional user metadata
      }
    })
    
    return { data, error }
  },

  signIn: async ({ email, password }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { data, error }
  },

  signOut: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// Server-side auth helpers
export const serverAuth = {
  getCurrentUser: async () => {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    const supabase = createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// Profile helpers
export const profile = {
  create: async (profileData) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
    
    return { data, error }
  },

  get: async (userId) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  update: async (userId, updates) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
    
    return { data, error }
  }
}