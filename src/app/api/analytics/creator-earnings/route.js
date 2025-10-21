import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    let creatorId = url.searchParams.get('creator_id');
    const period = url.searchParams.get('period') || 'month';
    const category = url.searchParams.get('category') || 'all';

    // If no creator_id provided, get from authenticated session
    if (!creatorId) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
      
      creatorId = session.user.id;
    }

    // Create admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range based on period
    const now = new Date();
    let from;
    switch(period) {
      case 'day':
        from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const to = new Date();

    // Get creator's works
    const { data: works, error: worksErr } = await svc
      .from('creative_works')
      .select('id,title,category')
      .eq('creator_id', creatorId);

    if (worksErr) {
      console.error('Works error:', worksErr);
      return new Response(JSON.stringify({ totalRevenue: 0, totalSales: 0, revenueByType: {}, salesByDay: {}, topWorks: [] }), { status: 200 });
    }

    const workIds = new Set((works || []).map(w => w.id));
    const worksById = (works || []).reduce((acc, w) => { acc[w.id] = w; return acc; }, {});

    // Get all orders
    const { data: orders, error: ordersErr } = await svc
      .from('orders')
      .select('id,amount_bidr,license_offering_id,created_at');

    if (ordersErr) {
      console.error('Orders error:', ordersErr);
      return new Response(JSON.stringify({ totalRevenue: 0, totalSales: 0, revenueByType: {}, salesByDay: {}, topWorks: [] }), { status: 200 });
    }

    // Get license offerings
    const { data: offerings } = await svc.from('license_offerings').select('id,work_id,license_type');
    const offeringsById = (offerings || []).reduce((acc, o) => { acc[o.id] = o; return acc; }, {});

    // Filter orders for creator's works within date range
    const creatorOrders = (orders || []).filter(o => {
      const lo = offeringsById[o.license_offering_id];
      if (!lo) return false;
      if (!workIds.has(lo.work_id)) return false;
      
      const orderDate = new Date(o.created_at);
      if (orderDate < from || orderDate > to) return false;
      
      if (category !== 'all') {
        const work = worksById[lo.work_id];
        if (!work || work.category !== category) return false;
      }
      
      return true;
    });

    // Aggregate analytics
    const revenueByType = {};
    const salesByDay = {};
    const topWorksMap = {};
    let totalRevenue = 0;

    creatorOrders.forEach(o => {
      const lo = offeringsById[o.license_offering_id];
      const work = worksById[lo.work_id];
      const type = lo.license_type || 'unknown';
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const amt = Number(o.amount_bidr || 0);
      
      totalRevenue += amt;
      revenueByType[type] = (revenueByType[type] || 0) + amt;
      salesByDay[day] = (salesByDay[day] || 0) + 1;
      
      if (!topWorksMap[work.id]) {
        topWorksMap[work.id] = { workId: work.id, title: work.title, revenue: 0, count: 0 };
      }
      topWorksMap[work.id].revenue += amt;
      topWorksMap[work.id].count += 1;
    });

    const topWorks = Object.values(topWorksMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return new Response(JSON.stringify({
      totalRevenue,
      totalSales: creatorOrders.length,
      revenueByType,
      salesByDay,
      topWorks
    }), { status: 200 });

  } catch(err) {
    console.error('analytics error', err);
    return new Response(JSON.stringify({ totalRevenue: 0, totalSales: 0, revenueByType: {}, salesByDay: {}, topWorks: [] }), { status: 200 });
  }
}
