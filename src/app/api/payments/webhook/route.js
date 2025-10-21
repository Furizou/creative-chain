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

    // ==========================================
    // STEP 2: MINT LICENSE NFT
    // ==========================================

    // Fetch additional data needed for minting
    const { data: creativeWork, error: workError } = await supabaseAdmin
      .from('creative_works')
      .select('title, creator_id, profiles(full_name)')
      .eq('id', order.license_offerings.work_id)
      .single();

    if (workError || !creativeWork) {
      console.error('Error fetching creative work:', workError);
      return NextResponse.json(
        {
          error: 'Failed to fetch creative work details',
          success: false
        },
        { status: 500 }
      );
    }

    // Calculate expiry date based on duration_days
    let expiryDate = null;
    if (order.license_offerings.duration_days) {
      const purchaseDate = new Date();
      expiryDate = new Date(purchaseDate.getTime() + order.license_offerings.duration_days * 24 * 60 * 60 * 1000);
    }

    // Prepare minting request payload
    const mintRequest = {
      buyerUserId: order.buyer_id,
      workId: order.license_offerings.work_id,
      licenseOfferingId: order.license_offering_id,
      orderId: order.id,
      licenseType: order.license_offerings.license_type,
      workTitle: creativeWork.title,
      creatorName: creativeWork.profiles?.full_name || 'Unknown Creator',
      terms: order.license_offerings.terms || `License for ${order.license_offerings.license_type}`,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      usageLimit: order.license_offerings.usage_limit,
      priceBidr: order.amount_bidr,
      transactionHash: order.id // Using order UUID as payment transaction reference
    };

    console.log('Initiating license minting for order:', orderId);
    console.log('Mint request payload:', mintRequest);

    // Call the internal minting API
    try {
      const mintResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blockchain/mint-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintRequest)
      });

      const mintResult = await mintResponse.json();

      if (!mintResponse.ok || !mintResult.success) {
        console.error('License minting failed:', mintResult);
        // Log error but don't fail the webhook - order is already paid
        console.log(`Order ${orderId} was marked as paid but license minting failed: ${mintResult.message || mintResult.error}`);

        return NextResponse.json(
          {
            success: true,
            orderId: orderId,
            message: 'Order marked as paid but license minting failed',
            warning: mintResult.message || mintResult.error,
            mintError: mintResult
          },
          { status: 200 }
        );
      }

      console.log(`License minted successfully for order ${orderId}:`, {
        licenseId: mintResult.licenseId,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash
      });

      // ==========================================
      // STEP 3: UPDATE ORDER STATUS TO COMPLETED
      // ==========================================

      const { error: completeError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (completeError) {
        console.error('Error updating order to completed:', completeError);
        // Don't fail - minting succeeded
      } else {
        console.log(`Order ${orderId} status updated to 'completed'`);
      }

      // Return success with minting details
      return NextResponse.json(
        {
          success: true,
          orderId: orderId,
          licenseId: mintResult.licenseId,
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          polygonscanUrl: mintResult.polygonscanUrl,
          message: 'Payment confirmed and license minted successfully'
        },
        { status: 200 }
      );

    } catch (mintError) {
      console.error('Unexpected error during license minting:', mintError);
      // Order is already paid, so return success with warning
      return NextResponse.json(
        {
          success: true,
          orderId: orderId,
          message: 'Order marked as paid but license minting encountered an error',
          warning: mintError.message
        },
        { status: 200 }
      );
    }

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