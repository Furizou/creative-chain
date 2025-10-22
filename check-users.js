// Check current logged in user
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkCurrentUser() {
  console.log('🔍 Checking Current Session...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // This won't work for server-side check, but let's see what users exist
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
    
    if (error) {
      console.log('❌ Error:', error.message)
      return
    }
    
    console.log('👤 All users in database:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Username: ${user.username || 'N/A'}`)
      console.log(`   Full Name: ${user.full_name || 'N/A'}`)
      console.log('')
    })
    
    // Check which user has creative works
    for (const user of users) {
      const { data: works, error: worksError } = await supabase
        .from('creative_works')
        .select('id, title')
        .eq('creator_id', user.id)
      
      if (!worksError && works?.length > 0) {
        console.log(`🎨 User ${user.username || user.id} has ${works.length} creative works`)
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

checkCurrentUser()