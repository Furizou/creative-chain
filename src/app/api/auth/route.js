// API route for authentication
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCustodialWallet } from '../../../lib/wallet-manager.js';

// Create server-side Supabase client with service role for auth operations
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

export async function POST(request) {
  const { email, password, type } = await request.json();

  try {
    if (type === 'signin') {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return NextResponse.json({ user: data.user });
    } else if (type === 'signup') {
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Automatically create custodial wallet for new user
      if (data.user) {
        try {
          const walletInfo = await createCustodialWallet(data.user.id);
          console.log(`Created custodial wallet for new user: ${walletInfo.address}`);

          // Return user with wallet address
          return NextResponse.json({
            user: data.user,
            walletAddress: walletInfo.address
          });
        } catch (walletError) {
          // Log error but don't fail signup - wallet can be created later
          console.error('Failed to create custodial wallet during signup:', walletError);

          return NextResponse.json({
            user: data.user,
            warning: 'Account created but wallet creation failed. Please contact support.'
          });
        }
      }

      return NextResponse.json({ user: data.user });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}