import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  // Generate unique request ID for debugging
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔵 [${requestId}] Starting login process`);
  
  try {
    const { email, password } = await request.json();
    
    console.log(`🔍 [${requestId}] Login attempt:`, {
      email: email ? '***@***.***' : '',
      hasPassword: !!password,
      passwordLength: password?.length || 0
    });

    // Validate required fields
    if (!email || !password) {
      console.error(`❌ [${requestId}] Missing required fields:`, {
        hasEmail: !!email,
        hasPassword: !!password
      });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Required fields present`);

    // Create Supabase client for route handler
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log(`✅ [${requestId}] Supabase client created`);

    // Attempt to sign in
    console.log(`🔵 [${requestId}] Attempting Supabase authentication`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log(`🔍 [${requestId}] Supabase auth result:`, {
      hasData: !!authData,
      hasUser: !!(authData?.user),
      hasSession: !!(authData?.session),
      userId: authData?.user?.id,
      userEmail: authData?.user?.email,
      hasError: !!authError,
      errorMessage: authError?.message,
      errorCode: authError?.code
    });

    if (authError) {
      console.error(`❌ [${requestId}] Auth error details:`, {
        message: authError.message,
        code: authError.code,
        status: authError.status,
        details: authError
      });
      
      // Handle specific error types
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message || 'Login failed' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      console.error(`❌ [${requestId}] No user data returned from auth`);
      return NextResponse.json(
        { error: 'Login failed - no user data' },
        { status: 401 }
      );
    }

    console.log(`✅ [${requestId}] User authenticated successfully`);

    // Fetch user profile data
    console.log(`🔵 [${requestId}] Fetching user profile`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, wallet_address')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error(`❌ [${requestId}] Profile fetch error:`, profileError);
      // Don't fail login if profile fetch fails - user can complete setup later
    } else {
      console.log(`✅ [${requestId}] Profile fetched successfully:`, {
        username: profile?.username,
        fullName: profile?.full_name,
        hasWallet: !!profile?.wallet_address
      });
    }

    // Check if user has a custodial wallet
    console.log(`🔵 [${requestId}] Checking custodial wallet`);
    const { data: wallet, error: walletError } = await supabase
      .from('custodial_wallets')
      .select('wallet_address')
      .eq('user_id', authData.user.id)
      .single();

    if (walletError && !walletError.message.includes('No rows')) {
      console.error(`❌ [${requestId}] Wallet check error:`, walletError);
    } else if (wallet) {
      console.log(`✅ [${requestId}] Custodial wallet found:`, {
        hasAddress: !!wallet.wallet_address
      });
    } else {
      console.log(`⚠️ [${requestId}] No custodial wallet found`);
    }

    const loginResponse = {
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile?.username,
        fullName: profile?.full_name,
        avatarUrl: profile?.avatar_url,
        walletAddress: profile?.wallet_address || wallet?.wallet_address,
        hasWallet: !!wallet
      },
      session: {
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
        expiresAt: authData.session?.expires_at
      }
    };

    console.log(`✅ [${requestId}] Login completed successfully`);
    
    return NextResponse.json(loginResponse);

  } catch (error) {
    console.error(`❌ [${requestId}] Login API error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      details: error
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}