import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: salesData, error: salesError } = await supabase
      .from('licenses')
      .select(`
        id,
        price_bidr,
        purchased_at,
        license_type,
        creative_works!inner(creator_id, category)
      `)
      .eq('creative_works.creator_id', userId)
      .gte('purchased_at', thirtyDaysAgo.toISOString())
      .order('purchased_at', { ascending: true });

    if (salesError) {
      console.error('Sales activity error:', salesError);
      return NextResponse.json({ error: 'Failed to fetch sales activity' }, { status: 500 });
    }

    // Process daily sales for the last 30 days
    const dailySales = {};
    
    // Initialize all days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailySales[dateKey] = {
        date: dateKey,
        sales: 0,
        revenue: 0
      };
    }

    // Aggregate actual sales
    salesData?.forEach(sale => {
      const dateKey = sale.purchased_at.split('T')[0];
      if (dailySales[dateKey]) {
        dailySales[dateKey].sales += 1;
        dailySales[dateKey].revenue += sale.price_bidr || 0;
      }
    });

    const activityData = Object.values(dailySales);

    // Calculate trends
    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.price_bidr || 0), 0) || 0;
    
    // Category breakdown
    const categoryBreakdown = {};
    salesData?.forEach(sale => {
      const category = sale.creative_works?.category || 'Other';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { sales: 0, revenue: 0 };
      }
      categoryBreakdown[category].sales += 1;
      categoryBreakdown[category].revenue += sale.price_bidr || 0;
    });

    // License type breakdown
    const licenseTypeBreakdown = {};
    salesData?.forEach(sale => {
      const type = sale.license_type || 'Unknown';
      if (!licenseTypeBreakdown[type]) {
        licenseTypeBreakdown[type] = { sales: 0, revenue: 0 };
      }
      licenseTypeBreakdown[type].sales += 1;
      licenseTypeBreakdown[type].revenue += sale.price_bidr || 0;
    });

    return NextResponse.json({
      dailyActivity: activityData,
      summary: {
        totalSales,
        totalRevenue,
        avgSaleValue: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data
      })),
      licenseTypeBreakdown: Object.entries(licenseTypeBreakdown).map(([type, data]) => ({
        type,
        ...data
      }))
    });

  } catch (error) {
    console.error('Sales activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}