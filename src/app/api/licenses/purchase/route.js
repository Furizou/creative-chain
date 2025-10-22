import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { license_offering_id, payment_method = 'mock_gateway' } = await request.json();

    if (!license_offering_id) {
      return NextResponse.json({ error: 'License offering ID is required' }, { status: 400 });
    }

    // Start transaction
    const { data, error } = await supabase.rpc('purchase_license', {
      p_license_offering_id: license_offering_id,
      p_buyer_id: user.id,
      p_payment_method: payment_method
    });

    if (error) {
      console.error('Purchase license error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order_id: data.order_id,
      license_id: data.license_id,
      amount_idr: data.amount_idr,
      amount_bidr: data.amount_bidr,
      royalty_distributions: data.royalty_distributions
    });

  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alternative implementation without stored procedure
export async function POST_MANUAL(request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { license_offering_id, payment_method = 'mock_gateway' } = await request.json();

    if (!license_offering_id) {
      return NextResponse.json({ error: 'License offering ID is required' }, { status: 400 });
    }

    // 1. Validate license offering exists and is active
    const { data: licenseOffering, error: licenseError } = await supabase
      .from('license_offerings')
      .select(`
        *,
        creative_works!inner(
          id,
          title,
          creator_id,
          royalty_splits(
            recipient_address,
            split_percentage
          )
        )
      `)
      .eq('id', license_offering_id)
      .eq('is_active', true)
      .single();

    if (licenseError || !licenseOffering) {
      return NextResponse.json({ error: 'License offering not found or inactive' }, { status: 404 });
    }

    // 2. Check if buyer is not the creator
    if (licenseOffering.creative_works.creator_id === user.id) {
      return NextResponse.json({ error: 'Cannot purchase license for your own work' }, { status: 400 });
    }

    // 3. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        license_offering_id: license_offering_id,
        buyer_id: user.id,
        amount_idr: licenseOffering.price_idr,
        amount_bidr: licenseOffering.price_bidr,
        payment_method: payment_method,
        status: 'paid' // Mock payment - immediately paid
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 4. Create license record
    const licenseData = {
      order_id: order.id,
      work_id: licenseOffering.creative_works.id,
      buyer_id: user.id,
      license_offering_id: license_offering_id,
      usage_limit: licenseOffering.usage_limit,
      purchased_at: new Date().toISOString()
    };

    // Set expiry date if duration is specified
    if (licenseOffering.duration_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + licenseOffering.duration_days);
      licenseData.expires_at = expiryDate.toISOString();
    }

    const { data: license, error: licenseCreateError } = await supabase
      .from('licenses')
      .insert(licenseData)
      .select()
      .single();

    if (licenseCreateError) {
      console.error('License creation error:', licenseCreateError);
      return NextResponse.json({ error: 'Failed to create license' }, { status: 500 });
    }

    // 5. Calculate and record royalty splits
    const royaltySplits = licenseOffering.creative_works.royalty_splits || [];
    const royaltyDistributions = [];

    for (const split of royaltySplits) {
      const amountIdr = (licenseOffering.price_idr * split.split_percentage) / 100;
      const amountBidr = (licenseOffering.price_bidr * split.split_percentage) / 100;

      const { data: distribution, error: distributionError } = await supabase
        .from('royalty_distributions')
        .insert({
          license_id: license.id,
          recipient_address: split.recipient_address,
          amount_idr: amountIdr,
          amount_bidr: amountBidr,
          split_percentage: split.split_percentage,
          status: 'completed' // Mock - immediately completed
        })
        .select()
        .single();

      if (!distributionError) {
        royaltyDistributions.push(distribution);
      }
    }

    // 6. Update order status to completed
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      license_id: license.id,
      work_title: licenseOffering.creative_works.title,
      license_type: licenseOffering.license_type,
      amount_idr: licenseOffering.price_idr,
      amount_bidr: licenseOffering.price_bidr,
      expires_at: license.expires_at,
      usage_limit: license.usage_limit,
      royalty_distributions: royaltyDistributions
    });

  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}