/**
 * @fileoverview Payment Initiation API Route
 * Handles POST requests to create new payment sessions for license purchases
 * Now integrates with the order system
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/initiate
 * Creates a new payment session by first creating an order
 * 
 * @param {NextRequest} request - The incoming request
 * @returns {NextResponse} JSON response with payment session details
 */
export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { license_offering_id, user_id } = body;

    // Validate required fields
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

    // Call our order creation endpoint to generate a pending order
    const orderResponse = await fetch(new URL('/api/orders/create', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies from original request
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie')
        }),
        // Forward any authorization headers
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')
        })
      },
      body: JSON.stringify({
        license_offering_id,
        user_id // Forward user_id if provided
      })
    });

    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('Order creation failed:', orderResult);
      return NextResponse.json(
        {
          error: orderResult.error || 'Failed to create order',
          success: false
        },
        { status: orderResponse.status }
      );
    }

    const orderId = orderResult.id;

    // Generate mock payment URL with the order ID
    const paymentUrl = `/payment-demo/process/${orderId}`;

    console.log(`Payment session initiated for order ${orderId}`);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        orderId: orderId,
        paymentUrl: paymentUrl,
        message: 'Payment session created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in payment initiation API:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to create payment session',
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
      error: 'Method not allowed. Use POST to initiate payment.',
      success: false 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to initiate payment.',
      success: false 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to initiate payment.',
      success: false 
    },
    { status: 405 }
  );
}