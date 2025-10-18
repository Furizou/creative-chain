'use server'

import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Get total works count
    const { count: totalWorks } = await supabase
      .from('creative_works')
      .select('*', { count: 'exact', head: true })

    // Get unique creators count
    const { count: activeCreators } = await supabase
      .from('creative_works')
      .select('creator_id', { count: 'exact', head: true })
      .not('creator_id', 'is', null)

    // Get total transactions
    const { count: totalTransactions } = await supabase
      .from('license_transactions')
      .select('*', { count: 'exact', head: true })

    return Response.json({
      totalWorks: totalWorks || 0,
      activeCreators: activeCreators || 0,
      totalTransactions: totalTransactions || 0
    })
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    return Response.json({ 
      totalWorks: 0, 
      activeCreators: 0, 
      totalTransactions: 0 
    }, { status: 500 })
  }
}
