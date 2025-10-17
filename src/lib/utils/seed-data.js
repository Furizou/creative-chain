import { createClient } from '@/lib/supabase/server'

/**
 * Utility script untuk create sample data setelah users dibuat
 * Jalankan dari API route atau server action
 */

export async function createSampleData() {
  const supabase = createClient()
  
  try {
    // 1. Get existing users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(3)
    
    if (usersError || !users || users.length === 0) {
      console.log('No users found. Please create users first through signup.')
      return { success: false, message: 'No users found' }
    }
    
    console.log('Found users:', users)
    
    // 2. Create profiles for existing users (if they don't exist)
    const profilesData = users.map((user, index) => ({
      id: user.id,
      username: `user_${index + 1}`,
      full_name: `User ${index + 1}`,
      wallet_address: `0x${index + 1}234567890123456789012345678901234567890`
    }))
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .upsert(profilesData, { onConflict: 'id' })
      .select()
    
    if (profilesError) {
      console.error('Error creating profiles:', profilesError)
      return { success: false, error: profilesError }
    }
    
    console.log('Created profiles:', profiles)
    
    // 3. Create sample creative works
    if (profiles && profiles.length > 0) {
      const worksData = [
        {
          creator_id: profiles[0].id,
          title: 'Sample Digital Art',
          description: 'A beautiful digital artwork',
          category: 'Digital Art',
          file_url: 'https://placeholder.storage/art1.jpg',
          file_hash: 'hash1234567890abcdef'
        },
        {
          creator_id: profiles[1]?.id || profiles[0].id,
          title: 'Sample Photography',
          description: 'Street photography collection',
          category: 'Photography', 
          file_url: 'https://placeholder.storage/photo1.jpg',
          file_hash: 'hash2345678901bcdefg'
        }
      ]
      
      const { data: works, error: worksError } = await supabase
        .from('creative_works')
        .insert(worksData)
        .select()
      
      if (worksError) {
        console.error('Error creating works:', worksError)
        return { success: false, error: worksError }
      }
      
      console.log('Created works:', works)
      
      // 4. Create sample analytics events
      if (works && works.length > 0) {
        const analyticsData = []
        
        works.forEach(work => {
          // Add some view events
          for (let i = 0; i < 5; i++) {
            analyticsData.push({
              work_id: work.id,
              event_type: 'view',
              user_id: Math.random() > 0.5 ? null : profiles[0].id, // Some anonymous, some authenticated
              created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
            })
          }
        })
        
        const { error: analyticsError } = await supabase
          .from('analytics_events')
          .insert(analyticsData)
        
        if (analyticsError) {
          console.error('Error creating analytics:', analyticsError)
        } else {
          console.log('Created analytics events:', analyticsData.length)
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Sample data created successfully',
      data: { profiles, works: profiles ? 'created' : 'skipped' }
    }
    
  } catch (error) {
    console.error('Error in createSampleData:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Clean up sample data (untuk testing)
 */
export async function cleanupSampleData() {
  const supabase = createClient()
  
  try {
    // Delete in reverse order due to foreign key constraints
    await supabase.from('analytics_events').delete().neq('id', 0)
    await supabase.from('licenses').delete().neq('id', 0)  
    await supabase.from('royalty_splits').delete().neq('id', 0)
    await supabase.from('creative_works').delete().neq('id', 0)
    // Note: Don't delete profiles as they're tied to auth.users
    
    return { success: true, message: 'Sample data cleaned up' }
  } catch (error) {
    console.error('Error cleaning up:', error)
    return { success: false, error: error.message }
  }
}