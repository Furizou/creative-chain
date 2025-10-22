// Check demo data completeness
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkDemoData() {
  console.log('🔍 Checking Demo Data Completeness...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const demoUserId = '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2'
  
  try {
    console.log('👤 Demo User ID:', demoUserId)
    
    // Check creative works
    const { data: works, error: worksError } = await supabase
      .from('creative_works')
      .select('*')
      .eq('creator_id', demoUserId)
    
    if (worksError) {
      console.log('❌ Works error:', worksError.message)
    } else {
      console.log(`\n🎨 Creative Works: ${works?.length || 0}`)
      works?.forEach((work, index) => {
        console.log(`${index + 1}. ${work.title} (${work.id})`)
      })
    }
    
    // Check license offerings for demo works
    if (works?.length > 0) {
      const workIds = works.map(w => w.id)
      const { data: offerings, error: offeringsError } = await supabase
        .from('license_offerings')
        .select('*')
        .in('work_id', workIds)
      
      if (offeringsError) {
        console.log('❌ Offerings error:', offeringsError.message)
      } else {
        console.log(`\n💳 License Offerings: ${offerings?.length || 0}`)
        offerings?.forEach((offering, index) => {
          console.log(`${index + 1}. ${offering.title} - ${offering.price_bidr} BIDR (${offering.id})`)
        })
      }
      
      // Check licenses
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .in('work_id', workIds)
      
      if (licensesError) {
        console.log('❌ Licenses error:', licensesError.message)
      } else {
        console.log(`\n📜 Licenses: ${licenses?.length || 0}`)
        licenses?.forEach((license, index) => {
          console.log(`${index + 1}. ${license.license_type} - ${license.price_bidr} BIDR (${license.id})`)
          console.log(`   Buyer: ${license.buyer_id}`)
          console.log(`   Date: ${new Date(license.purchased_at).toLocaleDateString()}`)
        })
        
        // Calculate total revenue
        const totalRevenue = licenses?.reduce((sum, license) => sum + parseFloat(license.price_bidr), 0) || 0
        console.log(`\n💰 Total Revenue: ${totalRevenue} BIDR`)
      }
      
      // Check royalty splits
      const { data: splits, error: splitsError } = await supabase
        .from('royalty_splits')
        .select('*')
        .in('work_id', workIds)
      
      if (splitsError) {
        console.log('❌ Splits error:', splitsError.message)
      } else {
        console.log(`\n📊 Royalty Splits: ${splits?.length || 0}`)
      }
    }
    
    console.log('\n✅ Check complete!')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

checkDemoData()