import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route creates demo users for testing
// Should be disabled in production

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Demo users API requires Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
}

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

const demoUsers = [
  {
    email: 'creator@demo.com',
    password: 'Demo123!',
    fullName: 'Demo Creator',
    username: 'demo_creator',
    role: 'creator'
  },
  {
    email: 'buyer@demo.com',
    password: 'Demo123!',
    fullName: 'Demo Buyer',
    username: 'demo_buyer', 
    role: 'buyer'
  },
  {
    email: 'artist@demo.com',
    password: 'Demo123!',
    fullName: 'Demo Artist',
    username: 'demo_artist',
    role: 'creator'
  }
];

export async function POST(request) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Demo users feature requires Supabase configuration',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file'
        },
        { status: 503 }
      );
    }

    // Dynamic import of wallet manager to avoid early evaluation
    const { createCustodialWallet } = await import('@/lib/wallet-manager');

    // Check if demo users already exist
    const results = [];

    for (const demoUser of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.some(u => u.email === demoUser.email);

        if (userExists) {
          results.push({
            email: demoUser.email,
            status: 'already_exists',
            message: 'User already exists'
          });
          continue;
        }

        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: demoUser.email,
          password: demoUser.password,
          email_confirm: true, // Auto-confirm for demo users
          user_metadata: {
            full_name: demoUser.fullName,
            username: demoUser.username
          }
        });

        if (authError) {
          results.push({
            email: demoUser.email,
            status: 'error',
            message: authError.message
          });
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: demoUser.username,
              full_name: demoUser.fullName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error(`Profile creation error for ${demoUser.email}:`, profileError);
        }

        // Create custodial wallet
        try {
          const wallet = await createCustodialWallet(authData.user.id);
          
          // Update profile with wallet address
          await supabaseAdmin
            .from('profiles')
            .update({ wallet_address: wallet.address })
            .eq('id', authData.user.id);

          results.push({
            email: demoUser.email,
            status: 'created',
            message: 'Demo user created successfully',
            userId: authData.user.id,
            walletAddress: wallet.address
          });

        } catch (walletError) {
          console.error(`Wallet creation error for ${demoUser.email}:`, walletError);
          
          results.push({
            email: demoUser.email,
            status: 'partial',
            message: 'User created but wallet creation failed',
            userId: authData.user.id
          });
        }

      } catch (userError) {
        console.error(`Error creating demo user ${demoUser.email}:`, userError);
        results.push({
          email: demoUser.email,
          status: 'error',
          message: userError.message
        });
      }
    }

    return NextResponse.json({
      message: 'Demo users setup completed',
      results
    });

  } catch (error) {
    console.error('Demo users creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo users' },
      { status: 500 }
    );
  }
}

// GET method to check demo users status
export async function GET(request) {
  try {
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const demoUserStatus = demoUsers.map(demoUser => {
      const exists = allUsers.users.some(u => u.email === demoUser.email);
      return {
        email: demoUser.email,
        username: demoUser.username,
        role: demoUser.role,
        exists
      };
    });

    return NextResponse.json({
      demoUsers: demoUserStatus,
      totalUsers: allUsers.users.length
    });

  } catch (error) {
    console.error('Demo users check error:', error);
    return NextResponse.json(
      { error: 'Failed to check demo users' },
      { status: 500 }
    );
  }
}