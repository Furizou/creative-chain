/**
 * @fileoverview Payment Webhook API Route
 * Handles POST requests from payment providers to update order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handlePaymentWebhook } from '@/lib/payment-gateway.js';

/**
 * POST /api/payments/webhook
 * Processes payment webhook notifications from payment providers
 * 
 * @param {NextRequest} request - The incoming webhook request
 * @returns {NextResponse} Status response indicating webhook processing result
 */
export async function POST(request) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    
    // Log the incoming webhook for debugging (remove in production)
    console.log('Received payment webhook:', payload);

    // Validate required fields in the payload
    const requiredFields = ['order_id', 'work_id', 'buyer_id', 'license_type', 'price_usdt'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      console.error('Webhook payload missing required fields:', missingFields);
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
          success: false
        },
        { status: 400 }
      );
    }

    // Create admin Supabase client with service role key for trusted server-side operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Process the webhook using our payment gateway library
    const webhookResult = await handlePaymentWebhook(supabaseAdmin, payload);

    // Check if webhook processing was successful
    if (!webhookResult.success) {
      console.error('Webhook processing failed:', webhookResult);
      return NextResponse.json(
        {
          error: webhookResult.error || 'Webhook processing failed',
          success: false,
          orderId: webhookResult.orderId
        },
        { status: 400 }
      );
    }

    // License created successfully
    console.log(`License created successfully: ${webhookResult.licenseId} for payment: ${webhookResult.orderId}`);

    // TODO: Trigger blockchain transaction processing
    // This is where we would initiate the license minting process on the blockchain
    // Example: await mintLicenseNFT(webhookResult.licenseId);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        orderId: webhookResult.orderId,
        licenseId: webhookResult.licenseId,
        message: 'License created successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing payment webhook:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Internal server error processing webhook',
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
      error: 'Method not allowed. This endpoint only accepts POST requests from payment webhooks.',
      success: false 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only accepts POST requests from payment webhooks.',
      success: false 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only accepts POST requests from payment webhooks.',
      success: false 
    },
    { status: 405 }
  );
}