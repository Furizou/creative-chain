import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get authenticated user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const user = session.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No user found' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Note: profile might not exist, that's okay - we can still get stats from works
    // Get total works for creator
    const { data: works, error: worksError } = await supabase
      .from('creative_works')
      .select('id')
      .eq('creator_id', user.id);
    
    if (worksError) {
      console.error('Error fetching works:', worksError);
      return new Response(
        JSON.stringify({ error: 'Error fetching works' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get orders for creator's works
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        amount_bidr,
        status,
        license_offering:license_offering_id (
          work_id
        )
      `);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Error fetching orders' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Filter to only creator's works
    const workIds = new Set(works.map(w => w.id));
    const creatorOrders = orders.filter(o => 
      o.license_offering && workIds.has(o.license_offering.work_id)
    );

    // Calculate totals
    const totalRevenue = creatorOrders.reduce((sum, order) => sum + Number(order.amount_bidr || 0), 0);
    const totalSales = creatorOrders.length;
    const availableBalance = 0; // Placeholder

    return NextResponse.json({
      totalWorks: works.length,
      totalRevenue,
      totalSales,
      availableBalance
    });

  } catch (error) {
    console.error('Error in creator-stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
