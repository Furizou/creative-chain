import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Search parameters
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const creator = searchParams.get('creator');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const licenseType = searchParams.get('license_type');
    const hasActiveLicense = searchParams.get('has_active_license');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Sort parameters
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const supabase = await createClient();

    // Build the base query
    let query = supabase
      .from('creative_works')
      .select(`
        id,
        title,
        description,
        category,
        file_url,
        file_hash,
        nft_token_id,
        nft_tx_hash,
        created_at,
        updated_at,
        profiles!creator_id(
          id,
          username,
          full_name,
          avatar_url,
          wallet_address
        ),
        copyright_certificates(
          id,
          nft_token_id,
          nft_contract_address,
          transaction_hash,
          blockchain_network,
          created_at
        ),
        license_offerings(
          id,
          license_type,
          title,
          description,
          price_idr,
          price_bidr,
          usage_limit,
          duration_days,
          is_active
        ),
        royalty_splits(
          id,
          recipient_address,
          split_percentage
        )
      `);

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,profiles.username.ilike.%${search}%`);
    }

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (creator) {
      query = query.eq('creator_id', creator);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'title', 'category', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    query = query.order(sortField, { ascending: order === 'asc' });

    // Get total count for pagination (without filters for now - optimize later)
    const { count } = await supabase
      .from('creative_works')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: works, error } = await query;

    if (error) {
      console.error('Creative works query error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Post-process data to apply price and license filters
    let filteredWorks = works;

    // Filter by price range (check active license offerings)
    if (minPrice || maxPrice) {
      filteredWorks = filteredWorks.filter(work => {
        const activeLicenses = work.license_offerings.filter(lo => lo.is_active);
        if (activeLicenses.length === 0) return false;
        
        const prices = activeLicenses.map(lo => parseFloat(lo.price_idr));
        const minWorkPrice = Math.min(...prices);
        const maxWorkPrice = Math.max(...prices);
        
        let passesFilter = true;
        if (minPrice && minWorkPrice < parseFloat(minPrice)) passesFilter = false;
        if (maxPrice && maxWorkPrice > parseFloat(maxPrice)) passesFilter = false;
        
        return passesFilter;
      });
    }

    // Filter by license type
    if (licenseType) {
      filteredWorks = filteredWorks.filter(work => {
        return work.license_offerings.some(lo => 
          lo.is_active && lo.license_type === licenseType
        );
      });
    }

    // Filter by active license availability
    if (hasActiveLicense === 'true') {
      filteredWorks = filteredWorks.filter(work => {
        return work.license_offerings.some(lo => lo.is_active);
      });
    }

    // Calculate additional metadata for each work
    const processedWorks = filteredWorks.map(work => {
      const activeLicenses = work.license_offerings.filter(lo => lo.is_active);
      const prices = activeLicenses.map(lo => parseFloat(lo.price_idr));
      
      return {
        id: work.id,
        title: work.title,
        description: work.description,
        category: work.category,
        file_url: work.file_url,
        file_hash: work.file_hash,
        created_at: work.created_at,
        updated_at: work.updated_at,
        creator: {
          id: work.profiles.id,
          username: work.profiles.username,
          full_name: work.profiles.full_name,
          avatar_url: work.profiles.avatar_url,
          wallet_address: work.profiles.wallet_address
        },
        copyright: work.copyright_certificates[0] || null,
        license_offerings: activeLicenses.map(lo => ({
          id: lo.id,
          license_type: lo.license_type,
          title: lo.title,
          description: lo.description,
          price_idr: lo.price_idr,
          price_bidr: lo.price_bidr,
          usage_limit: lo.usage_limit,
          duration_days: lo.duration_days
        })),
        royalty_splits: work.royalty_splits.map(rs => ({
          recipient_address: rs.recipient_address,
          split_percentage: rs.split_percentage
        })),
        pricing: {
          min_price_idr: prices.length > 0 ? Math.min(...prices) : null,
          max_price_idr: prices.length > 0 ? Math.max(...prices) : null,
          has_active_licenses: activeLicenses.length > 0,
          license_count: activeLicenses.length
        },
        nft: {
          token_id: work.nft_token_id,
          transaction_hash: work.nft_tx_hash
        }
      };
    });

    // Calculate pagination metadata
    const totalRecords = filteredWorks.length; // This is approximate after filtering
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: processedWorks,
      pagination: {
        page,
        limit,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next: hasNext,
        has_prev: hasPrev
      },
      filters: {
        search,
        category,
        creator,
        min_price: minPrice,
        max_price: maxPrice,
        license_type: licenseType,
        has_active_license: hasActiveLicense
      },
      sort: {
        sort_by: sortField,
        sort_order: order
      }
    });

  } catch (error) {
    console.error('Creative works browse API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST method for creating new creative work
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      title, 
      description, 
      category, 
      file_url, 
      file_hash 
    } = await request.json();

    // Validate required fields
    if (!title || !file_url || !file_hash) {
      return NextResponse.json({ 
        error: 'title, file_url, and file_hash are required' 
      }, { status: 400 });
    }

    // Create the creative work
    const { data: work, error } = await supabase
      .from('creative_works')
      .insert({
        creator_id: user.id,
        title,
        description,
        category,
        file_url,
        file_hash
      })
      .select(`
        id,
        title,
        description,
        category,
        file_url,
        file_hash,
        created_at,
        profiles!creator_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Creative work creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      work: {
        id: work.id,
        title: work.title,
        description: work.description,
        category: work.category,
        file_url: work.file_url,
        file_hash: work.file_hash,
        created_at: work.created_at,
        creator: work.profiles
      }
    });

  } catch (error) {
    console.error('Creative work creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
