/**
 * @fileoverview Payment Initiation API Route
 * Handles POST requests to create new payment sessions for license purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSession } from '@/lib/payment-gateway.js';

/**
 * POST /api/payments/initiate
 * Creates a new payment session for a license offering
 * 
 * @param {NextRequest} request - The incoming request
 * @returns {NextResponse} JSON response with payment session details
 */
export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { work_id, price_usdt } = body;

    // Validate required fields
    if (!work_id) {
      return NextResponse.json(
        { 
          error: 'Missing required field: work_id',
          success: false 
        },
        { status: 400 }
      );
    }

    if (!price_usdt || typeof price_usdt !== 'number' || price_usdt <= 0) {
      return NextResponse.json(
        { 
          error: 'Invalid price_usdt: must be a positive number',
          success: false 
        },
        { status: 400 }
      );
    }

    // Create payment session using our payment gateway library
    const paymentSession = await createPaymentSession(work_id, price_usdt);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        orderId: paymentSession.orderId,
        paymentUrl: paymentSession.paymentUrl,
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