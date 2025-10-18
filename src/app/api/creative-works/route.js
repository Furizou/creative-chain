'use server'

import { supabase } from '@/lib/supabase/client'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = 12

    let query = supabase
      .from('creative_works')
      .select('*', { count: 'exact' })

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

    if (error) throw error

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
