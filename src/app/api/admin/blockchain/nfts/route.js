/**
 * GET /api/admin/blockchain/nfts
 *
 * Fetch all copyright certificates and licenses for admin dashboard
 * Uses service role to bypass RLS
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request) {
  try {
    // Fetch copyright certificates
    const { data: certs, error: certsError } = await supabaseAdmin
      .from('copyright_certificates')
      .select('*')
      .eq('minting_status', 'confirmed')
      .order('minted_at', { ascending: false });

    if (certsError) {
      console.error('Error fetching certificates:', certsError);
      return NextResponse.json(
        {
          success: false,
          error: 'FETCH_ERROR',
          message: 'Failed to fetch certificates',
          details: certsError.message
        },
        { status: 500 }
      );
    }

    // Fetch licenses
    const { data: lics, error: licsError } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .order('purchased_at', { ascending: false });

    if (licsError) {
      console.error('Error fetching licenses:', licsError);
      return NextResponse.json(
        {
          success: false,
          error: 'FETCH_ERROR',
          message: 'Failed to fetch licenses',
          details: licsError.message
        },
        { status: 500 }
      );
    }

    // Fetch related data for certificates
    let enrichedCerts = certs || [];
    if (enrichedCerts.length > 0) {
      const workIds = [...new Set(enrichedCerts.map(c => c.creative_work_id).filter(Boolean))];
      const userIds = [...new Set(enrichedCerts.map(c => c.user_id).filter(Boolean))];

      const [worksData, usersData] = await Promise.all([
        workIds.length > 0
          ? supabaseAdmin.from('creative_works').select('id, title, category').in('id', workIds)
          : { data: [] },
        userIds.length > 0
          ? supabaseAdmin.from('profiles').select('id, username, full_name').in('id', userIds)
          : { data: [] }
      ]);

      // Map the data
      const worksMap = new Map((worksData.data || []).map(w => [w.id, w]));
      const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));

      enrichedCerts = enrichedCerts.map(cert => ({
        ...cert,
        creative_works: worksMap.get(cert.creative_work_id),
        profiles: usersMap.get(cert.user_id)
      }));
    }

    // Fetch related data for licenses
    let enrichedLics = lics || [];
    if (enrichedLics.length > 0) {
      const workIds = [...new Set(enrichedLics.map(l => l.work_id).filter(Boolean))];
      const buyerIds = [...new Set(enrichedLics.map(l => l.buyer_id).filter(Boolean))];

      const [worksData, buyersData] = await Promise.all([
        workIds.length > 0
          ? supabaseAdmin.from('creative_works').select('id, title, category').in('id', workIds)
          : { data: [] },
        buyerIds.length > 0
          ? supabaseAdmin.from('profiles').select('id, username, full_name').in('id', buyerIds)
          : { data: [] }
      ]);

      // Map the data
      const worksMap = new Map((worksData.data || []).map(w => [w.id, w]));
      const buyersMap = new Map((buyersData.data || []).map(b => [b.id, b]));

      enrichedLics = enrichedLics.map(lic => ({
        ...lic,
        creative_works: worksMap.get(lic.work_id),
        profiles: buyersMap.get(lic.buyer_id)
      }));
    }

    return NextResponse.json({
      success: true,
      certificates: enrichedCerts,
      licenses: enrichedLics
    });

  } catch (error) {
    console.error('Error in admin NFTs endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      },
      { status: 500 }
    );
  }
}
