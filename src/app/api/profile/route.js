import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Fetch user profile
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        wallet_address,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch custodial wallet info
    const { data: wallet, error: walletError } = await supabase
      .from('custodial_wallets')
      .select('wallet_address, blockchain, created_at')
      .eq('user_id', user.id)
      .single();

    if (walletError && !walletError.message.includes('No rows')) {
      console.error('Wallet fetch error:', walletError);
    }

    // Get user statistics
    const { data: worksCount } = await supabase
      .from('creative_works')
      .select('id', { count: 'exact' })
      .eq('creator_id', user.id);

    const { data: licensesCount } = await supabase
      .from('licenses')
      .select('id', { count: 'exact' })
      .eq('buyer_id', user.id);

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        custodialWallet: wallet || null,
        statistics: {
          worksCount: worksCount?.length || 0,
          licensesCount: licensesCount?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, fullName, avatarUrl } = await request.json();

    // Validate input
    const updateData = {};
    
    if (username !== undefined) {
      // Validate username
      if (username.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters long' },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
          { status: 400 }
        );
      }

      // Check if username is already taken (excluding current user)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }

      updateData.username = username;
    }

    if (fullName !== undefined) {
      if (fullName.trim().length < 2) {
        return NextResponse.json(
          { error: 'Full name must be at least 2 characters long' },
          { status: 400 }
        );
      }
      updateData.full_name = fullName.trim();
    }

    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        email: user.email,
        emailVerified: !!user.email_confirmed_at
      }
    });

  } catch (error) {
    console.error('Profile PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}