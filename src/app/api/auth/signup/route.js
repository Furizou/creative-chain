import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCustodialWallet } from '@/lib/wallet-manager';

// Create server-side Supabase client with service role for auth operations
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function POST(request) {
  // Generate unique request ID for debugging
  const requestId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔵 [${requestId}] Starting signup process`);
  
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      console.error(`❌ [${requestId}] Supabase not configured`);
      return NextResponse.json(
        { error: 'Authentication service not configured. Please set up Supabase environment variables.' },
        { status: 503 }
      );
    }

    console.log(`✅ [${requestId}] Supabase admin client initialized`);

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
      console.log(`✅ [${requestId}] Request body parsed:`, {
        email: requestBody.email ? '***@***.***' : undefined,
        hasPassword: !!requestBody.password,
        fullName: requestBody.fullName,
        username: requestBody.username
      });
    } catch (parseError) {
      console.error(`❌ [${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { email, password, fullName, username } = requestBody;

    // Validate required fields
    if (!email || !password || !fullName || !username) {
      console.error(`❌ [${requestId}] Missing required fields:`, {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFullName: !!fullName,
        hasUsername: !!username
      });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] All required fields present`);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`❌ [${requestId}] Invalid email format: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Email format valid`);

    // Validate password strength
    if (password.length < 8) {
      console.error(`❌ [${requestId}] Password too short: ${password.length} characters`);
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      console.error(`❌ [${requestId}] Password doesn't meet complexity requirements`);
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Password validation passed`);

    // Validate username
    if (username.length < 3) {
      console.error(`❌ [${requestId}] Username too short: ${username.length} characters`);
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      console.error(`❌ [${requestId}] Invalid username format: ${username}`);
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Username validation passed`);

    // Check if username is already taken
    console.log(`🔍 [${requestId}] Checking if username exists: ${username}`);
    try {
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`❌ [${requestId}] Error checking username:`, checkError);
        return NextResponse.json(
          { error: 'Failed to validate username availability' },
          { status: 500 }
        );
      }

      if (existingProfile) {
        console.error(`❌ [${requestId}] Username already taken: ${username}`);
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }

      console.log(`✅ [${requestId}] Username available`);
    } catch (usernameCheckError) {
      console.error(`❌ [${requestId}] Username check failed:`, usernameCheckError);
      return NextResponse.json(
        { error: 'Failed to validate username availability' },
        { status: 500 }
      );
    }

    // Create user account
    console.log(`🔵 [${requestId}] Creating user account via Supabase Auth`);
    let authData, authError;
    try {
      const createUserResult = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification - user can login immediately
        user_metadata: {
          full_name: fullName,
          username
        }
      });
      
      authData = createUserResult.data;
      authError = createUserResult.error;
      
      console.log(`🔍 [${requestId}] Supabase createUser result:`, {
        hasData: !!authData,
        hasUser: !!(authData?.user),
        userId: authData?.user?.id,
        userEmail: authData?.user?.email,
        hasError: !!authError,
        errorMessage: authError?.message,
        errorCode: authError?.code
      });
      
    } catch (createUserException) {
      console.error(`❌ [${requestId}] Exception during user creation:`, createUserException);
      return NextResponse.json(
        { error: 'Failed to create account due to server error' },
        { status: 500 }
      );
    }

    if (authError) {
      console.error(`❌ [${requestId}] Auth error details:`, {
        message: authError.message,
        code: authError.code,
        status: authError.status,
        details: authError
      });
      
      if (authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData?.user) {
      console.error(`❌ [${requestId}] No user data returned from auth creation`);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log(`✅ [${requestId}] User account created successfully:`, {
      userId: authData.user.id,
      email: authData.user.email
    });

    // Create user profile
    console.log(`🔵 [${requestId}] Creating user profile`);
    try {
      const profileData = {
        id: authData.user.id,
        username,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`🔍 [${requestId}] Profile data to insert:`, profileData);
      
      const { data: profileResult, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([profileData])
        .select();

      if (profileError) {
        console.error(`❌ [${requestId}] Profile creation error:`, {
          message: profileError.message,
          code: profileError.code,
          details: profileError
        });
        // Don't fail the signup if profile creation fails - we can retry later
        console.log(`⚠️ [${requestId}] Continuing despite profile creation failure`);
      } else {
        console.log(`✅ [${requestId}] Profile created successfully:`, profileResult);
      }

      // Create custodial wallet for the user
      console.log(`🔵 [${requestId}] Creating custodial wallet`);
      try {
        const wallet = await createCustodialWallet(authData.user.id);
        console.log(`✅ [${requestId}] Custodial wallet created:`, {
          userId: authData.user.id,
          walletAddress: wallet.address
        });
        
        // Update profile with wallet address
        console.log(`🔵 [${requestId}] Updating profile with wallet address`);
        const { error: walletUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ wallet_address: wallet.address })
          .eq('id', authData.user.id);

        if (walletUpdateError) {
          console.error(`❌ [${requestId}] Wallet address update error:`, walletUpdateError);
        } else {
          console.log(`✅ [${requestId}] Profile updated with wallet address`);
        }

      } catch (walletError) {
        console.error(`❌ [${requestId}] Wallet creation error:`, {
          message: walletError.message,
          stack: walletError.stack,
          details: walletError
        });
        // Don't fail signup if wallet creation fails - can be created later
        console.log(`⚠️ [${requestId}] Continuing despite wallet creation failure`);
      }

    } catch (postSignupError) {
      console.error(`❌ [${requestId}] Post-signup setup error:`, {
        message: postSignupError.message,
        stack: postSignupError.stack,
        details: postSignupError
      });
      // User is created but additional setup failed
      // This is acceptable - they can complete setup later
      console.log(`⚠️ [${requestId}] User created but additional setup failed`);
    }

    console.log(`✅ [${requestId}] Signup process completed successfully`);
    
    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        fullName
      }
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Signup API error:`, {
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