import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get total works count
    const { count: totalWorks, error: worksError } = await supabase
      .from('creative_works')
      .select('*', { count: 'exact', head: true })

    if (worksError) throw worksError

    // Get unique creators count
    const { count: activeCreators, error: creatorsError } = await supabase
      .from('creative_works')
      .select('creator_id', { count: 'exact', head: true })
      .not('creator_id', 'is', null)

    if (creatorsError) throw creatorsError

    // Get total transactions
    const { count: totalTransactions, error: transactionsError } = await supabase
      .from('license_transactions')
      .select('*', { count: 'exact', head: true })

    if (transactionsError) throw transactionsError

    return Response.json({
      totalWorks: totalWorks || 0,
      activeCreators: activeCreators || 0,
      totalTransactions: totalTransactions || 0
    })
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch stats',
        totalWorks: 0, 
        activeCreators: 0, 
        totalTransactions: 0 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
