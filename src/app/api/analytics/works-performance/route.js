import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createClient();
  
  try {
    // Get the authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Works Performance API - Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (sessionError || !session) {
      console.error('Works Performance API - No session:', sessionError);
      return NextResponse.json({ error: 'Unauthorized', details: sessionError?.message || 'No session' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Works Performance API - Processing for user:', userId);

    // Get performance data for all works
    const { data: worksData, error: worksError } = await supabase
      .from('creative_works')
      .select(`
        id,
        title,
        category,
        created_at,
        licenses(id, price_bidr, purchased_at),
        license_offerings(id, price_bidr)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (worksError) {
      console.error('Works performance error:', worksError);
      return NextResponse.json({ error: 'Failed to fetch works performance' }, { status: 500 });
    }

    // Calculate performance metrics for each work
    const performance = worksData?.map(work => {
      const licenses = work.licenses || [];
      const offerings = work.license_offerings || [];
      
      const totalRevenue = licenses.reduce((sum, license) => sum + (license.price_bidr || 0), 0);
      const totalSales = licenses.length;
      const avgPrice = offerings.length > 0 
        ? offerings.reduce((sum, offer) => sum + (offer.price_bidr || 0), 0) / offerings.length 
        : 0;
      
      // Calculate conversion rate (sales vs offerings)
      const conversionRate = offerings.length > 0 ? (totalSales / offerings.length) * 100 : 0;
      
      // Recent activity (sales in last 30 days)
      const recentSales = licenses.filter(license => {
        const saleDate = new Date(license.purchased_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= thirtyDaysAgo;
      }).length;

      return {
        id: work.id,
        title: work.title,
        category: work.category,
        totalRevenue,
        totalSales,
        avgPrice: Math.round(avgPrice),
        conversionRate: Math.round(conversionRate * 100) / 100,
        recentSales,
        createdAt: work.created_at
      };
    }) || [];

    // Sort by total revenue
    performance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json(performance);

  } catch (error) {
    console.error('Works performance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}