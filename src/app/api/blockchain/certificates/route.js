/**
 * GET /api/blockchain/certificates
 *
 * Get all certificates for a user or filter by status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET handler - Get user's certificates
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_USER_ID',
          message: 'userId parameter is required'
        },
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('copyright_certificates')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('minted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      if (!['pending', 'confirmed', 'failed'].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_STATUS',
            message: 'Status must be one of: pending, confirmed, failed'
          },
          { status: 400 }
        );
      }
      query = query.eq('minting_status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificates: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      },
      { status: 500 }
    );
  }
}
