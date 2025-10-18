/**
 * API route for custodial wallet operations
 *
 * Endpoints:
 * - GET: Get user's wallet address
 * - POST: Create wallet for existing user (if missing)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createCustodialWallet,
  getUserWalletAddress,
  hasUserWallet
} from '../../../lib/wallet-manager.js';

// Create server-side Supabase client
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

/**
 * GET /api/wallet
 * Returns the authenticated user's wallet address
 */
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user's wallet address
    const walletInfo = await getUserWalletAddress(user.id);

    if (!walletInfo) {
      return NextResponse.json(
        { error: 'No wallet found for user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: walletInfo.address,
      blockchain: walletInfo.blockchain
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet
 * Creates a custodial wallet for the authenticated user
 * (if they don't already have one)
 */
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user already has a wallet
    const hasWallet = await hasUserWallet(user.id);
    if (hasWallet) {
      const walletInfo = await getUserWalletAddress(user.id);
      return NextResponse.json({
        message: 'Wallet already exists',
        address: walletInfo.address,
        blockchain: walletInfo.blockchain
      });
    }

    // Create new wallet
    const { blockchain } = await request.json().catch(() => ({}));
    const walletInfo = await createCustodialWallet(user.id, blockchain);

    return NextResponse.json({
      message: 'Wallet created successfully',
      address: walletInfo.address,
      blockchain: blockchain || 'polygon-amoy'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
