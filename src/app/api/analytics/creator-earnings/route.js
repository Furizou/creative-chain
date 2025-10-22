import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Date range parameters
    const dateFrom = searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = searchParams.get('date_to') || new Date().toISOString();
    
    // Filter parameters
    const workId = searchParams.get('work_id');
    const licenseType = searchParams.get('license_type');
    const groupBy = searchParams.get('group_by') || 'date'; // date, license_type, work

    // Base query for creator's earnings
    let query = supabase
      .from('licenses')
      .select(`
        id,
        purchased_at,
        work_id,
        orders!inner(
          amount_idr,
          amount_bidr,
          status
        ),
        license_offerings!inner(
          license_type,
          title
        ),
        creative_works!inner(
          id,
          title,
          creator_id
        ),
        royalty_distributions(
          amount_idr,
          amount_bidr,
          recipient_address,
          status
        )
      `)
      .eq('creative_works.creator_id', user.id)
      .eq('orders.status', 'completed')
      .gte('purchased_at', dateFrom)
      .lte('purchased_at', dateTo);

    // Apply additional filters
    if (workId) {
      query = query.eq('work_id', workId);
    }

    if (licenseType) {
      query = query.eq('license_offerings.license_type', licenseType);
    }

    const { data: licenses, error } = await query;

    if (error) {
      console.error('Analytics query error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate total earnings
    const totalSales = licenses.length;
    const totalRevenueIdr = licenses.reduce((sum, license) => 
      sum + parseFloat(license.orders.amount_idr), 0
    );
    const totalRevenueBidr = licenses.reduce((sum, license) => 
      sum + parseFloat(license.orders.amount_bidr), 0
    );

    // Calculate actual creator earnings (after royalty splits)
    const creatorEarningsIdr = licenses.reduce((sum, license) => {
      const royaltyDistributions = license.royalty_distributions || [];
      const creatorDistribution = royaltyDistributions.find(dist => 
        dist.recipient_address === user.wallet_address
      );
      return sum + (creatorDistribution ? parseFloat(creatorDistribution.amount_idr) : parseFloat(license.orders.amount_idr));
    }, 0);

    const creatorEarningsBidr = licenses.reduce((sum, license) => {
      const royaltyDistributions = license.royalty_distributions || [];
      const creatorDistribution = royaltyDistributions.find(dist => 
        dist.recipient_address === user.wallet_address
      );
      return sum + (creatorDistribution ? parseFloat(creatorDistribution.amount_bidr) : parseFloat(license.orders.amount_bidr));
    }, 0);

    // Group data based on groupBy parameter
    let groupedData = {};

    if (groupBy === 'date') {
      // Group by date (daily)
      groupedData = licenses.reduce((acc, license) => {
        const date = license.purchased_at.split('T')[0]; // Get YYYY-MM-DD
        if (!acc[date]) {
          acc[date] = {
            date,
            sales_count: 0,
            revenue_idr: 0,
            revenue_bidr: 0,
            creator_earnings_idr: 0,
            creator_earnings_bidr: 0
          };
        }
        
        acc[date].sales_count += 1;
        acc[date].revenue_idr += parseFloat(license.orders.amount_idr);
        acc[date].revenue_bidr += parseFloat(license.orders.amount_bidr);
        
        // Calculate creator's share
        const royaltyDistributions = license.royalty_distributions || [];
        const creatorDistribution = royaltyDistributions.find(dist => 
          dist.recipient_address === user.wallet_address
        );
        acc[date].creator_earnings_idr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_idr) : parseFloat(license.orders.amount_idr);
        acc[date].creator_earnings_bidr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_bidr) : parseFloat(license.orders.amount_bidr);
        
        return acc;
      }, {});

    } else if (groupBy === 'license_type') {
      // Group by license type
      groupedData = licenses.reduce((acc, license) => {
        const type = license.license_offerings.license_type;
        if (!acc[type]) {
          acc[type] = {
            license_type: type,
            sales_count: 0,
            revenue_idr: 0,
            revenue_bidr: 0,
            creator_earnings_idr: 0,
            creator_earnings_bidr: 0
          };
        }
        
        acc[type].sales_count += 1;
        acc[type].revenue_idr += parseFloat(license.orders.amount_idr);
        acc[type].revenue_bidr += parseFloat(license.orders.amount_bidr);
        
        const royaltyDistributions = license.royalty_distributions || [];
        const creatorDistribution = royaltyDistributions.find(dist => 
          dist.recipient_address === user.wallet_address
        );
        acc[type].creator_earnings_idr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_idr) : parseFloat(license.orders.amount_idr);
        acc[type].creator_earnings_bidr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_bidr) : parseFloat(license.orders.amount_bidr);
        
        return acc;
      }, {});

    } else if (groupBy === 'work') {
      // Group by creative work
      groupedData = licenses.reduce((acc, license) => {
        const workId = license.work_id;
        const workTitle = license.creative_works.title;
        
        if (!acc[workId]) {
          acc[workId] = {
            work_id: workId,
            work_title: workTitle,
            sales_count: 0,
            revenue_idr: 0,
            revenue_bidr: 0,
            creator_earnings_idr: 0,
            creator_earnings_bidr: 0
          };
        }
        
        acc[workId].sales_count += 1;
        acc[workId].revenue_idr += parseFloat(license.orders.amount_idr);
        acc[workId].revenue_bidr += parseFloat(license.orders.amount_bidr);
        
        const royaltyDistributions = license.royalty_distributions || [];
        const creatorDistribution = royaltyDistributions.find(dist => 
          dist.recipient_address === user.wallet_address
        );
        acc[workId].creator_earnings_idr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_idr) : parseFloat(license.orders.amount_idr);
        acc[workId].creator_earnings_bidr += creatorDistribution ? 
          parseFloat(creatorDistribution.amount_bidr) : parseFloat(license.orders.amount_bidr);
        
        return acc;
      }, {});
    }

    // Get top performing works
    const topWorks = await supabase
      .from('licenses')
      .select(`
        work_id,
        creative_works!inner(
          title,
          creator_id
        ),
        orders!inner(
          amount_idr,
          status
        )
      `)
      .eq('creative_works.creator_id', user.id)
      .eq('orders.status', 'completed')
      .gte('purchased_at', dateFrom)
      .lte('purchased_at', dateTo);

    const topWorksData = topWorks.data ? 
      Object.values(
        topWorks.data.reduce((acc, item) => {
          const workId = item.work_id;
          if (!acc[workId]) {
            acc[workId] = {
              work_id: workId,
              title: item.creative_works.title,
              sales_count: 0,
              revenue_idr: 0
            };
          }
          acc[workId].sales_count += 1;
          acc[workId].revenue_idr += parseFloat(item.orders.amount_idr);
          return acc;
        }, {})
      ).sort((a, b) => b.revenue_idr - a.revenue_idr).slice(0, 5) : [];

    return NextResponse.json({
      success: true,
      summary: {
        total_sales: totalSales,
        total_revenue: {
          idr: totalRevenueIdr,
          bidr: totalRevenueBidr
        },
        creator_earnings: {
          idr: creatorEarningsIdr,
          bidr: creatorEarningsBidr
        },
        date_range: {
          from: dateFrom,
          to: dateTo
        }
      },
      grouped_data: Object.values(groupedData),
      top_works: topWorksData,
      metadata: {
        group_by: groupBy,
        filters: {
          work_id: workId,
          license_type: licenseType
        }
      }
    });

  } catch (error) {
    console.error('Creator earnings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST method for creating analytics events
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { work_id, event_type, user_id } = await request.json();

    if (!work_id || !event_type) {
      return NextResponse.json({ 
        error: 'work_id and event_type are required' 
      }, { status: 400 });
    }

    const validEventTypes = ['view', 'play', 'download', 'share', 'favorite'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ 
        error: 'Invalid event_type. Must be one of: ' + validEventTypes.join(', ') 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        work_id,
        event_type,
        user_id: user_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Analytics event creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      event: data
    });

  } catch (error) {
    console.error('Analytics event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
