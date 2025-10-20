/**
 * @fileoverview Payment Webhook API Route
 * Handles POST requests from payment providers to update order status
 * Now integrates with the new order system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { order_id: orderId } = payload;
    
    if (!orderId) {
      console.error('Webhook payload missing required order_id field');
      return NextResponse.json(
        {
          error: 'Missing required field: order_id',
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
          error: 'Invalid orderId format. Must be a valid UUID.',
          success: false
        },
        { status: 400 }
      );
    }

    // Create admin Supabase client with service role key for trusted server-side operations
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

    // Find the corresponding order in the database with license offering details
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, license_offerings(*)')
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

    // Check if order is already paid
    if (order.status === 'paid') {
      console.log(`Order ${orderId} is already marked as paid`);
      return NextResponse.json(
        {
          success: true,
          orderId: orderId,
          message: 'Order already processed',
          status: 'already_paid'
        },
        { status: 200 }
      );
    }

    // Update order status from 'pending' to 'paid'
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        {
          error: `Failed to update order status: ${updateError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    console.log(`Order ${orderId} status updated to 'paid' successfully`);

    // Create license record for the completed order
    const licenseData = {
      work_id: order.license_offerings.work_id,
      buyer_id: order.buyer_id,
      license_type: order.license_offerings.license_type,
      price_usdt: order.amount_idr, // TODO: Implement real currency conversion from IDR to USDT
      transaction_hash: order.id, // Using order UUID as transaction hash for now
      order_id: order.id,
      license_offering_id: order.license_offering_id
    };

    const { data: newLicense, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert(licenseData)
      .select()
      .single();

    if (licenseError) {
      console.error('Error creating license:', licenseError);
      // Note: Order is already marked as paid, so we log the error but don't fail the webhook
      console.log(`Order ${orderId} was marked as paid but license creation failed`);
    } else {
      console.log(`License created successfully for order ${orderId}:`, newLicense.id);
      // TODO: Initiate blockchain minting for the new license ID
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        orderId: orderId,
        message: 'Order status updated to paid successfully'
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