import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = 12

    let query = supabase
      .from('creative_works')
      .select(`
        *,
        creator:profiles!creative_works_creator_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'popular':
        query = query.order('views', { ascending: false })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    const { data: works, count, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch works' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return Response.json({
      works: works || [],
      total: count || 0,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    })
  } catch (error) {
    console.error('Error fetching creative works:', error)
    return Response.json({ 
      works: [],
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false
    }, { status: 500 })
  }
}
