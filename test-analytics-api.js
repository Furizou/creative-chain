// Test what the API is actually seeing
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testAnalyticsAPI() {
  console.log('🔍 Testing Analytics API Logic...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const demoUserId = '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2'
  
  try {
    console.log('👤 Testing for demo user:', demoUserId)
    
    // Simulate the revenue API query
    console.log('\n📊 Testing Revenue API Query:')
    const { data: revenueData, error: revenueError } = await supabase
      .from('licenses')
      .select(`
        id,
        price_bidr,
        purchased_at,
        creative_works!inner(creator_id)
      `)
      .eq('creative_works.creator_id', demoUserId)
      .gte('purchased_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('purchased_at', { ascending: true })
    
    if (revenueError) {
      console.log('❌ Revenue API Error:', revenueError.message)
    } else {
      console.log('✅ Revenue Data Found:', revenueData?.length || 0, 'licenses')
      if (revenueData?.length > 0) {
        console.log('💰 Sample license:', revenueData[0])
      }
    }
    
    // Test basic creator stats
    console.log('\n📈 Testing Creator Stats:')
    const { data: statsData, error: statsError } = await supabase
      .from('creative_works')
      .select('id, title')
      .eq('creator_id', demoUserId)
    
    if (statsError) {
      console.log('❌ Stats Error:', statsError.message)
    } else {
      console.log('✅ Creative Works Found:', statsData?.length || 0)
      statsData?.forEach((work, index) => {
        console.log(`${index + 1}. ${work.title} (${work.id})`)
      })
    }
    
    // Test licenses for these works
    if (statsData?.length > 0) {
      const workIds = statsData.map(w => w.id)
      console.log('\n📜 Testing Licenses for these works:')
      
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .in('work_id', workIds)
      
      if (licensesError) {
        console.log('❌ Licenses Error:', licensesError.message)
      } else {
        console.log('✅ Licenses Found:', licensesData?.length || 0)
        const totalRevenue = licensesData?.reduce((sum, license) => sum + parseFloat(license.price_bidr), 0) || 0
        console.log('💰 Total Revenue:', totalRevenue, 'BIDR')
      }
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message)
  }
}

testAnalyticsAPI()