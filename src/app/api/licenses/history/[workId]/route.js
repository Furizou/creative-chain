import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create Supabase admin client for server-side operations
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
 * GET /api/licenses/history/[workId]
 * Fetch public license transaction history for a creative work
 * 
 * @param {Request} request - The incoming request
 * @param {Object} params - Route parameters containing workId
 * @returns {Response} JSON response with license transaction history
 */
export async function GET(request, { params }) {
  try {
    // Extract workId from URL parameters
    const { workId } = await params;

    // Validate workId parameter
    if (!workId) {
      return NextResponse.json(
        { 
          error: 'Work ID is required',
          success: false 
        },
        { status: 400 }
      );
    }

    // Validate UUID format (optional but recommended)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workId)) {
      return NextResponse.json(
        { 
          error: 'Invalid work ID format',
          success: false 
        },
        { status: 400 }
      );
    }

    // Query the licenses table with profile information
    const { data: licenseHistory, error: queryError } = await supabaseAdmin
      .from('licenses')
      .select(`
        *,
        profiles!buyer_id(username)
      `)
      .eq('work_id', workId)
      .order('purchased_at', { ascending: false });

    // Handle query errors
    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch license history',
          success: false,
          details: process.env.NODE_ENV === 'development' ? queryError.message : undefined
        },
        { status: 500 }
      );
    }

    // Transform the data to flatten the profile information
    const transformedHistory = licenseHistory?.map(license => ({
      id: license.id,
      work_id: license.work_id,
      buyer_id: license.buyer_id,
      buyer_username: license.profiles?.username || 'Unknown',
      license_type: license.license_type,
      price_idr: license.price_idr,
      price_bidr: license.price_bidr,
      price_usdt: license.price_usdt,
      purchased_at: license.purchased_at,
      usage_limit: license.usage_limit,
      duration_days: license.duration_days,
      valid_until: license.valid_until,
      transaction_hash: license.transaction_hash,
      nft_transaction_hash: license.nft_transaction_hash,
      status: license.status,
      created_at: license.created_at,
      updated_at: license.updated_at
    })) || [];

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: transformedHistory,
        count: transformedHistory.length,
        work_id: workId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error in /api/licenses/history/[workId]:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}