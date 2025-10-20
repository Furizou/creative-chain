/**
 * @fileoverview Order Details API Route
 * Handles GET requests to fetch individual order details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/orders/[id]
 * Fetches details of a specific order by ID
 * 
 * @param {NextRequest} request - The incoming request
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - URL parameters
 * @param {string} context.params.id - Order ID from the URL
 * @returns {NextResponse} Order details or error response
 */
export async function GET(request, { params }) {
  try {
    // Extract order ID from URL parameters
    const { id: orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        {
          error: 'Order ID is required',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        {
          error: 'Invalid order ID format. Must be a valid UUID.',
          success: false
        },
        { status: 400 }
      );
    }

    // Create Supabase admin client with service role key
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

    // Query the orders table for the specific order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        // No rows returned - order not found
        return NextResponse.json(
          {
            error: 'Order not found',
            success: false
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          error: `Failed to fetch order: ${fetchError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          error: 'Order not found',
          success: false
        },
        { status: 404 }
      );
    }

    // Return the order details
    return NextResponse.json(
      {
        success: true,
        data: order
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in order details API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
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
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only accepts GET requests.',
      success: false 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only accepts GET requests.',
      success: false 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only accepts GET requests.',
      success: false 
    },
    { status: 405 }
  );
}