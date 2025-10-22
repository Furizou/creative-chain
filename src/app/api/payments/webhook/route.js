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

    // Find the corresponding order with license offering and creative work details
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        license_offerings(*,
          creative_works(id, title, creator_id,
            profiles:creator_id(full_name, username)
          )
        )
      `)
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

    // ==========================================
    // MINT LICENSE NFT ON BLOCKCHAIN
    // ==========================================

    console.log(`Initiating blockchain minting for order ${orderId}...`);

    // Extract creative work and creator details
    const creativeWork = order.license_offerings.creative_works;
    const workTitle = creativeWork?.title || order.license_offerings.title || 'Creative Work';
    const creatorProfile = creativeWork?.profiles;
    const creatorName = creatorProfile?.full_name || creatorProfile?.username || 'Creator';

    try {
      // Call the mint-license API endpoint
      const mintResponse = await fetch(new URL('/api/blockchain/mint-license', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerUserId: order.buyer_id,
          workId: order.license_offerings.work_id,
          licenseOfferingId: order.license_offering_id,
          orderId: order.id,
          licenseType: order.license_offerings.license_type,
          workTitle: workTitle,
          creatorName: creatorName,
          terms: order.license_offerings.terms || 'Standard license terms apply',
          expiryDate: order.license_offerings.duration_days
            ? new Date(Date.now() + order.license_offerings.duration_days * 24 * 60 * 60 * 1000).toISOString()
            : null,
          usageLimit: order.license_offerings.usage_limit || null,
          priceBidr: order.amount_bidr,
          transactionHash: order.id // Payment transaction reference (order ID)
        })
      });

      const mintResult = await mintResponse.json();

      if (!mintResponse.ok || !mintResult.success) {
        throw new Error(mintResult.message || 'License minting failed');
      }

      console.log(`License minted successfully for order ${orderId}:`, {
        licenseId: mintResult.licenseId,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash
      });

    } catch (mintError) {
      console.error(`Blockchain minting failed for order ${orderId}:`, mintError);

      // Order is already marked as paid, so we log the error but don't fail the webhook
      // The license record was created by the mint-license API, but without blockchain data
      console.log(`Order ${orderId} was marked as paid but blockchain minting failed`);

      // Note: In production, you might want to:
      // 1. Create a failed_blockchain_transactions record for retry
      // 2. Send notification to admin
      // 3. Update order with error status
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