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

    // Get revenue data for the last 12 months
    const { data: revenueData, error: revenueError } = await supabase
      .from('licenses')
      .select(`
        id,
        price_bidr,
        purchased_at,
        creative_works!inner(creator_id)
      `)
      .eq('creative_works.creator_id', userId)
      .gte('purchased_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('purchased_at', { ascending: true });

    if (revenueError) {
      console.error('Revenue error:', revenueError);
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
    }

    // Process revenue data by month
    const monthlyRevenue = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      monthlyRevenue[monthKey] = 0;
    }

    // Aggregate revenue by month
    revenueData?.forEach(license => {
      const date = new Date(license.purchased_at);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyRevenue.hasOwnProperty(monthKey)) {
        monthlyRevenue[monthKey] += license.price_bidr || 0;
      }
    });

    const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Revenue chart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}