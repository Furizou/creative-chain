// Debug script to check current user ID
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function debugUserData() {
  console.log('🔍 Debugging User Data...\n')
  
  // Check environment variables
  console.log('📍 Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('📍 Supabase Key:', supabaseKey ? 'Set' : 'Missing')
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Check demo data
    console.log('\n📊 Checking Demo Data:')
    
    // Check if demo profile exists
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'democreator')
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
    } else {
      console.log('👤 Demo profiles found:', profiles?.length || 0)
      if (profiles?.length > 0) {
        console.log('📋 Demo profile ID:', profiles[0].id)
        console.log('📋 Demo profile username:', profiles[0].username)
      }
    }
    
    // Check creative works
    const { data: works, error: worksError } = await supabase
      .from('creative_works')
      .select('*')
      .limit(5)
    
    if (worksError) {
      console.log('❌ Works error:', worksError.message)
    } else {
      console.log('🎨 Total creative works:', works?.length || 0)
      if (works?.length > 0) {
        console.log('📋 Sample work creator_id:', works[0].creator_id)
        console.log('📋 Sample work title:', works[0].title)
      }
    }
    
    // Check licenses
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .limit(5)
    
    if (licensesError) {
      console.log('❌ Licenses error:', licensesError.message)
    } else {
      console.log('📜 Total licenses:', licenses?.length || 0)
      if (licenses?.length > 0) {
        console.log('📋 Sample license buyer_id:', licenses[0].buyer_id)
        console.log('📋 Sample license price_bidr:', licenses[0].price_bidr)
      }
    }
    
    // Check license offerings
    const { data: offerings, error: offeringsError } = await supabase
      .from('license_offerings')
      .select('*')
      .limit(5)
    
    if (offeringsError) {
      console.log('❌ Offerings error:', offeringsError.message)
    } else {
      console.log('💳 Total license offerings:', offerings?.length || 0)
    }
    
    console.log('\n✅ Debug complete!')
    
  } catch (error) {
    console.log('❌ Debug error:', error.message)
  }
}

debugUserData()