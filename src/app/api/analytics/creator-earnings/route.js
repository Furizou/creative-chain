import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key required for privileged queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const svc = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const creatorId = url.searchParams.get('creator_id');
    const period = url.searchParams.get('period') || 'month';
    const category = url.searchParams.get('category') || 'all';

    if (!creatorId) return new Response(JSON.stringify({ error: 'creator_id required' }), { status: 400 });

    // Calculate date range based on period
    const now = new Date();
    let from, to;
    switch(period) {
      case 'day':
        from = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        from = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        from = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        from = new Date(now.setMonth(now.getMonth() - 1)); // Default to last month
    }
    to = new Date();

    // timeframe filter
    const rangeCond = [];
    if (from) rangeCond.push(`o.completed_at >= '${from}'`);
    if (to) rangeCond.push(`o.completed_at <= '${to}'`);
    const whereRange = rangeCond.length ? `AND ${rangeCond.join(' AND ')}` : '';

    // total revenue and sales
    const totalsQuery = `
      SELECT
        COALESCE(SUM(o.amount_bidr),0) AS total_revenue,
        COUNT(o.*) AS total_sales
      FROM orders o
      JOIN license_offerings lo ON lo.id = o.license_offering_id
      JOIN creative_works cw ON cw.id = lo.work_id
      WHERE cw.creator_id = '${creatorId}'
        AND o.status = 'completed'
      ${whereRange};
    `;

    const { data: totals, error: totalsErr } = await svc.rpc('sql', { q: totalsQuery }).catch(()=>({ data: null, error: true }));
    // Fallback: run raw via .from is limited; use simple queries instead

    // revenue by type
    const { data: byType, error: byTypeErr } = await svc.from('orders')
      .select('license_offering_id')
      .eq('status','completed')
      .limit(1);

    // Simpler aggregated queries using Postgres via remote SQL not available: build JS aggregation as fallback
    // Get completed orders for creator works
    const { data: orders, error: ordersErr } = await svc
      .from('orders')
      .select('id,amount_bidr,license_offering_id,created_at')
      .eq('status','completed')
      .order('created_at', { ascending: true });

    if (ordersErr) throw ordersErr;

    // Fetch license offerings and works map
    const { data: offerings } = await svc.from('license_offerings').select('*');
    const offeringsById = (offerings||[]).reduce((acc,o)=>{ acc[o.id]=o; return acc; },{});

    const { data: works } = await svc.from('creative_works').select('*');
    const worksById = (works||[]).reduce((acc,w)=>{ acc[w.id]=w; return acc; },{});

    // Filter orders by creator_id, date range, and category
    const creatorOrders = (orders||[]).filter(o=>{
      const lo = offeringsById[o.license_offering_id];
      if (!lo) return false;
      const work = worksById[lo.work_id];
      if (!work || work.creator_id !== creatorId) return false;
      
      // Date range filter
      const orderDate = new Date(o.created_at);
      if (orderDate < from || orderDate > to) return false;
      
      // Category filter
      if (category !== 'all' && work.category !== category) return false;
      
      return true;
    });

    // aggregate
    const revenueByType = {};
    const salesByDay = {};
    const topWorksMap = {};
    let totalRevenue = 0;

    for (const o of creatorOrders){
      const lo = offeringsById[o.license_offering_id];
      const work = worksById[lo.work_id];
      const type = lo.license_type || 'unknown';
      const day = new Date(o.created_at).toISOString().slice(0,10);
      const amt = Number(o.amount_bidr||0);
      totalRevenue += amt;
      revenueByType[type] = (revenueByType[type]||0) + amt;
      salesByDay[day] = (salesByDay[day]||0) + 1;
      if (!topWorksMap[work.id]) topWorksMap[work.id] = { workId: work.id, title: work.title, revenue: 0, count: 0 };
      topWorksMap[work.id].revenue += amt;
      topWorksMap[work.id].count += 1;
    }

    const topWorks = Object.values(topWorksMap).sort((a,b)=>b.revenue - a.revenue).slice(0,10);

    const payload = {
      totalRevenue,
      totalSales: creatorOrders.length,
      revenueByType,
      salesByDay,
      topWorks
    };

    return new Response(JSON.stringify(payload), { status: 200 });
  }catch(err){
    console.error('analytics error', err);
    return new Response(JSON.stringify({ error: err.message||'server error' }), { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET /api/analytics/creator-earnings?creator_id=...&from=yyyy-mm-dd&to=yyyy-mm-dd
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const creatorId = url.searchParams.get('creator_id');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!creatorId) {
      return NextResponse.json({ error: 'creator_id required' }, { status: 400 });
    }

    // Build time filter
    let licenseQuery = supabase.from('licenses').select('*');
    if (from) licenseQuery = licenseQuery.gte('purchased_at', from);
    if (to) licenseQuery = licenseQuery.lte('purchased_at', to);

    // Join licenses to works to filter by creator
    const { data: licenses, error: licensesErr } = await licenseQuery;
    if (licensesErr) throw licensesErr;

    // Filter licenses by works created by creatorId
    const { data: works, error: worksErr } = await supabase.from('creative_works').select('id,title').eq('creator_id', creatorId);
    if (worksErr) throw worksErr;
    const workIds = works.map(w => w.id);

    const filteredLicenses = (licenses || []).filter(l => workIds.includes(l.work_id));

    // total revenue
    const totalRevenue = filteredLicenses.reduce((s, l) => s + Number(l.price_usdt || 0), 0);

    // revenue by license type
    const revenueByType = {};
    filteredLicenses.forEach(l => {
      revenueByType[l.license_type] = (revenueByType[l.license_type] || 0) + Number(l.price_usdt || 0);
    });

    // sales over time (group by day)
    const salesByDay = {};
    filteredLicenses.forEach(l => {
      const day = new Date(l.purchased_at).toISOString().slice(0,10);
      salesByDay[day] = (salesByDay[day] || 0) + 1;
    });

    // top works by sales
    const workSales = {};
    filteredLicenses.forEach(l => {
      workSales[l.work_id] = (workSales[l.work_id] || 0) + 1;
    });

    const topWorks = Object.entries(workSales).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([workId,count])=>({ workId, count, title: works.find(w=>w.id===workId)?.title || '' }));

    return NextResponse.json({
      totalRevenue,
      revenueByType,
      salesByDay,
      topWorks,
    });
  } catch (err) {
    console.error('analytics error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
