import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { workId } = params;
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filter parameters
    const licenseType = searchParams.get('license_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const buyerId = searchParams.get('buyer_id');
    const status = searchParams.get('status');

    // Sort parameters
    const sortBy = searchParams.get('sort_by') || 'purchased_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const supabase = await createClient();

    // Build the query
    let query = supabase
      .from('licenses')
      .select(`
        id,
        purchased_at,
        expires_at,
        usage_count,
        usage_limit,
        nft_token_id,
        nft_transaction_hash,
        orders!inner(
          id,
          amount_idr,
          amount_bidr,
          status,
          payment_method
        ),
        license_offerings!inner(
          license_type,
          title,
          description
        ),
        profiles!buyer_id(
          id,
          username,
          full_name,
          avatar_url
        ),
        royalty_distributions(
          id,
          recipient_address,
          amount_idr,
          amount_bidr,
          split_percentage,
          status
        )
      `)
      .eq('work_id', workId);

    // Apply filters
    if (licenseType) {
      query = query.eq('license_offerings.license_type', licenseType);
    }

    if (dateFrom) {
      query = query.gte('purchased_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('purchased_at', dateTo);
    }

    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }

    if (status) {
      query = query.eq('orders.status', status);
    }

    // Apply sorting
    const validSortFields = ['purchased_at', 'amount_idr', 'amount_bidr', 'license_type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'purchased_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    if (sortField === 'amount_idr' || sortField === 'amount_bidr') {
      query = query.order(sortField, { foreignTable: 'orders', ascending: order === 'asc' });
    } else if (sortField === 'license_type') {
      query = query.order(sortField, { foreignTable: 'license_offerings', ascending: order === 'asc' });
    } else {
      query = query.order(sortField, { ascending: order === 'asc' });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', workId);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Ledger query error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Transform data for better frontend consumption
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      purchase_date: transaction.purchased_at,
      expiry_date: transaction.expires_at,
      license_type: transaction.license_offerings.license_type,
      license_title: transaction.license_offerings.title,
      license_description: transaction.license_offerings.description,
      buyer: {
        id: transaction.profiles.id,
        username: transaction.profiles.username,
        full_name: transaction.profiles.full_name,
        avatar_url: transaction.profiles.avatar_url
      },
      amount: {
        idr: transaction.orders.amount_idr,
        bidr: transaction.orders.amount_bidr
      },
      order: {
        id: transaction.orders.id,
        status: transaction.orders.status,
        payment_method: transaction.orders.payment_method
      },
      usage: {
        count: transaction.usage_count,
        limit: transaction.usage_limit
      },
      nft: {
        token_id: transaction.nft_token_id,
        transaction_hash: transaction.nft_transaction_hash
      },
      royalty_distributions: transaction.royalty_distributions.map(dist => ({
        id: dist.id,
        recipient_address: dist.recipient_address,
        amount_idr: dist.amount_idr,
        amount_bidr: dist.amount_bidr,
        split_percentage: dist.split_percentage,
        status: dist.status
      }))
    }));

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total_records: count,
        total_pages: totalPages,
        has_next: hasNext,
        has_prev: hasPrev
      },
      filters: {
        license_type: licenseType,
        date_from: dateFrom,
        date_to: dateTo,
        buyer_id: buyerId,
        status: status
      },
      sort: {
        sort_by: sortField,
        sort_order: order
      }
    });

  } catch (error) {
    console.error('Transaction ledger API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET summary statistics for the work
export async function POST(request, { params }) {
  try {
    const { workId } = params;
    const supabase = await createClient();

    // Get summary statistics
    const { data: stats, error } = await supabase
      .from('licenses')
      .select(`
        id,
        orders!inner(amount_idr, amount_bidr, status),
        license_offerings!inner(license_type)
      `)
      .eq('work_id', workId)
      .eq('orders.status', 'completed');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate statistics
    const totalSales = stats.length;
    const totalRevenueIdr = stats.reduce((sum, item) => sum + parseFloat(item.orders.amount_idr), 0);
    const totalRevenueBidr = stats.reduce((sum, item) => sum + parseFloat(item.orders.amount_bidr), 0);

    // Group by license type
    const licenseTypeStats = stats.reduce((acc, item) => {
      const type = item.license_offerings.license_type;
      if (!acc[type]) {
        acc[type] = { count: 0, revenue_idr: 0, revenue_bidr: 0 };
      }
      acc[type].count += 1;
      acc[type].revenue_idr += parseFloat(item.orders.amount_idr);
      acc[type].revenue_bidr += parseFloat(item.orders.amount_bidr);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      summary: {
        total_sales: totalSales,
        total_revenue: {
          idr: totalRevenueIdr,
          bidr: totalRevenueBidr
        },
        by_license_type: licenseTypeStats
      }
    });

  } catch (error) {
    console.error('Ledger summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}