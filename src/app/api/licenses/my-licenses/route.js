import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
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
 * GET /api/licenses/my-licenses
 * Fetch all licenses purchased by the authenticated user
 *
 * @param {Request} request - The incoming request
 * @returns {Response} JSON response with user's licenses
 */
export async function GET(request) {
  try {
    // Get authenticated session using SSR client
    const supabase = await createServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session retrieval error:', sessionError);
      return NextResponse.json(
        {
          error: 'Session error',
          success: false
        },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      console.error('Unauthorized: No authenticated session');
      return NextResponse.json(
        {
          error: 'Unauthorized - Please log in',
          success: false
        },
        { status: 401 }
      );
    }

    const user = session.user;
    console.log(`Fetching licenses for user: ${user.id}`);

    // Query the licenses table with creative work information
    const { data: licenses, error: queryError } = await supabaseAdmin
      .from('licenses')
      .select(`
        *,
        creative_works!work_id(
          id,
          title,
          description,
          category,
          file_url
        )
      `)
      .eq('buyer_id', user.id)
      .order('purchased_at', { ascending: false });

    // Handle query errors
    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        {
          error: 'Failed to fetch licenses',
          success: false,
          details: process.env.NODE_ENV === 'development' ? queryError.message : undefined
        },
        { status: 500 }
      );
    }

    console.log(`Found ${licenses?.length || 0} licenses for user ${user.id}`);

    // Transform the data to include work information
    const transformedLicenses = licenses?.map(license => ({
      id: license.id,
      work_id: license.work_id,
      work_title: license.creative_works?.title || 'Unknown Work',
      work_description: license.creative_works?.description,
      work_category: license.creative_works?.category,
      work_file_url: license.creative_works?.file_url,
      license_type: license.license_type,
      price_bidr: license.price_bidr,
      purchased_at: license.purchased_at,
      expires_at: license.expires_at,
      usage_count: license.usage_count,
      usage_limit: license.usage_limit,
      is_valid: license.is_valid,
      nft_token_id: license.nft_token_id,
      nft_contract_address: license.nft_contract_address,
      nft_transaction_hash: license.nft_transaction_hash,
      wallet_address: license.wallet_address,
      metadata: license.metadata,
      order_id: license.order_id,
      license_offering_id: license.license_offering_id
    })) || [];

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: transformedLicenses,
        count: transformedLicenses.length,
        user_id: user.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error in /api/licenses/my-licenses:', error);

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
