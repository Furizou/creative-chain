import { NextResponse } from 'next/server';

export async function GET() {
  // Debug endpoint to check environment variables (NEVER use in production)
  const envDebug = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here' ? 'PLACEHOLDER' : 'SET',
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseAnonKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here' ? 'PLACEHOLDER' : 'SET',
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseServiceKeyValue: process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_supabase_service_role_key_here' ? 'PLACEHOLDER' : 'SET',
    hasWalletEncryptionKey: !!process.env.WALLET_ENCRYPTION_KEY,
    walletEncryptionKeyValue: process.env.WALLET_ENCRYPTION_KEY === 'development_key_32_chars_long!!' ? 'DEVELOPMENT' : 'SET',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  console.log('🔍 Environment Debug Info:', envDebug);

  return NextResponse.json(envDebug);
}