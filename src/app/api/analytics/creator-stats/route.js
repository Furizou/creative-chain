import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
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

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get total works and calculate stats
    const { data: works, error: worksError } = await supabase
      .from('creative_works')
      .select(`
        id,
        license_transactions(
          amount
        )
      `)
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

    // Get total revenue from completed licenses
    const { data: revenue, error: revenueError } = await supabase
      .from('licenses')
      .select(`
        price_usdt,
        work:work_id (
          creator_id
        )
      `)
      .eq('work.creator_id', profile.id);

    if (revenueError) throw revenueError;

    // Calculate total revenue
    const totalRevenue = revenue.reduce((sum, license) => sum + Number(license.price_usdt), 0);

    // Get total sales (completed licenses)
    const totalSales = revenue.length;

    // Get available balance from pending royalty distributions
    const { data: distributions, error: distributionsError } = await supabase
      .from('royalty_distributions')
      .select('amount_idr')
      .eq('recipient_id', profile.id)
      .eq('status', 'pending');

    if (distributionsError) throw distributionsError;

    const availableBalance = distributions.reduce((sum, dist) => sum + Number(dist.amount_idr), 0);

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
