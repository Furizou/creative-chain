import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      );
    }

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get total works
    const { data: works, error: worksError } = await supabase
      .from('creative_works')
      .select('id')
      .eq('creator_id', profile.id);
    
    if (worksError) {
      return NextResponse.json(
        { error: 'Error fetching works' },
        { status: 500 }
      );
    }

    // Get total revenue from completed licenses
    const { data: revenue, error: revenueError } = await supabase
      .from('licenses')
      .select(`
        price_bidr,
        work:work_id (
          creator_id
        )
      `)
      .eq('work.creator_id', profile.id);

    if (revenueError) throw revenueError;

    // Calculate total revenue
    const totalRevenue = revenue.reduce((sum, license) => sum + Number(license.price_bidr), 0);

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
