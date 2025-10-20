/**
 * @fileoverview Orders Creation API Route
 * Handles POST requests to create new orders with secure authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/orders/create
 * Creates a new order for a license offering
 * 
 * @param {NextRequest} request - The incoming request with order data
 * @returns {NextResponse} JSON response with order creation result
 */
export async function POST(request) {
  try {
    // 1. Authentication: Secure the route with mock-aware logic
    const DEMO_BUYER_ID = 'ec452ac9-87d2-4df9-8f2d-c8efae09d5ab';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // First, always try to get a real session
    const { data: { session } } = await supabase.auth.getSession();

    let userId;

    if (session && session.user) {
      // 1. If a real session exists, use it.
      userId = session.user.id;
      console.log(`Authenticated with real user session: ${userId}`);
    } else if (process.env.NODE_ENV === 'development') {
      // 2. If no session, but we are in development, use the mock ID as a fallback.
      userId = DEMO_BUYER_ID;
      console.warn('⚠️ NO REAL SESSION: Using mock buyer ID for order creation as a fallback.');
    } else {
      // 3. If no session and we are in production, it's an error.
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required', success: false },
        { status: 401 }
      );
    }

    // Apply Principle of Least Privilege: Choose appropriate client based on authentication method
    let operationClient;

    if (session && session.user) {
      // Real user session: Use standard authenticated client (follows RLS)
      operationClient = supabase;
      console.log('Using authenticated user client for order creation (RLS enforced)');
    } else {
      // Development fallback with mock user: Use service role client (bypasses RLS)
      operationClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('Using service role client for development fallback (RLS bypassed)');
    }

    // 2. Parse and validate input
    const body = await request.json();
    const { license_offering_id } = body;

    if (!license_offering_id) {
      return NextResponse.json(
        {
          error: 'Missing required field: license_offering_id',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(license_offering_id)) {
      return NextResponse.json(
        {
          error: 'Invalid license_offering_id format. Must be a valid UUID.',
          success: false
        },
        { status: 400 }
      );
    }

    // 3. Fetch Price Details: Query license_offerings table
    const { data: offering, error: fetchError } = await operationClient
      .from('license_offerings')
      .select('price_idr, price_bidr')
      .eq('id', license_offering_id)
      .single();

    if (fetchError) {
      console.error('Error fetching license offering:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        // No rows returned - offering not found
        return NextResponse.json(
          {
            error: 'License offering not found',
            success: false
          },
          { status: 404 }
        );
      }
      
      // Other database error
      return NextResponse.json(
        {
          error: `Failed to fetch license offering: ${fetchError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    if (!offering) {
      return NextResponse.json(
        {
          error: 'License offering not found',
          success: false
        },
        { status: 404 }
      );
    }

    // 4. Database Insert: Create new order with fetched price details
    const { data: orderData, error: insertError } = await operationClient
      .from('orders')
      .insert({
        buyer_id: userId,
        license_offering_id: license_offering_id,
        amount_idr: offering.price_idr,
        amount_bidr: offering.price_bidr,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        {
          error: `Order creation failed: ${insertError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    // 5. Success Response: Return the newly created order ID
    console.log(`Order ${orderData.id} created successfully for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        id: orderData.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in order creation:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error during order creation',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to create orders.',
      success: false 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to create orders.',
      success: false 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to create orders.',
      success: false 
    },
    { status: 405 }
  );
}