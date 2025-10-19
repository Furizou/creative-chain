/**
 * Setup Test Environment for License Minting
 *
 * This script helps you:
 * 1. Find or create a test user
 * 2. Create a custodial wallet for the test user
 * 3. Display the TEST_USER_ID to use for testing
 *
 * Usage: node setup-test-environment.js
 */

import { createClient } from '@supabase/supabase-js';
import { createCustodialWallet, getUserWalletAddress } from './src/lib/wallet-manager.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });

console.log('='.repeat(70));
console.log('LICENSE MINTING TEST ENVIRONMENT SETUP');
console.log('='.repeat(70));
console.log();

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('\nRequired:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nPlease set these in your .env.local file');
  process.exit(1);
}

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

async function findOrCreateTestUser() {
  console.log('📋 Step 1: Finding or creating test user...\n');

  // Check if there's already a user in profiles table
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .limit(5);

  if (profileError) {
    console.error('❌ Error querying profiles:', profileError.message);
    console.log('\n💡 Tip: Make sure the profiles table exists and is accessible');
    return null;
  }

  if (profiles && profiles.length > 0) {
    console.log('✅ Found existing users in profiles table:\n');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   Email: ${profile.email || 'N/A'}`);
      console.log(`   Name: ${profile.full_name || 'N/A'}`);
      console.log();
    });

    // Use the first user
    console.log(`✅ Using user: ${profiles[0].id}`);
    return profiles[0].id;
  } else {
    console.log('⚠️  No users found in profiles table');
    console.log('\n💡 You need to create a user first through your app\'s signup process');
    console.log('   or manually insert a user into the profiles table.');
    return null;
  }
}

async function setupCustodialWallet(userId) {
  console.log('\n📋 Step 2: Setting up custodial wallet...\n');

  // Check if user already has a wallet
  const existingWallet = await getUserWalletAddress(userId);

  if (existingWallet) {
    console.log('✅ User already has a custodial wallet!');
    console.log(`   Address: ${existingWallet.address}`);
    console.log(`   Blockchain: ${existingWallet.blockchain}`);
    return existingWallet.address;
  }

  // Create new wallet
  console.log('⏳ Creating new custodial wallet...');
  try {
    const { address } = await createCustodialWallet(userId);
    console.log('✅ Custodial wallet created successfully!');
    console.log(`   Address: ${address}`);
    console.log(`   Blockchain: polygon-amoy`);
    return address;
  } catch (error) {
    console.error('❌ Failed to create wallet:', error.message);
    return null;
  }
}

async function verifyTestSetup(userId) {
  console.log('\n📋 Step 3: Verifying test setup...\n');

  const checks = [];

  // Check 1: User exists
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  const userExists = !!profile;
  checks.push({ name: 'User exists in profiles', status: userExists });
  console.log(`${userExists ? '✅' : '❌'} User exists in profiles table`);

  // Check 2: Wallet exists
  const wallet = await getUserWalletAddress(userId);
  const walletExists = !!wallet;
  checks.push({ name: 'Custodial wallet exists', status: walletExists });
  console.log(`${walletExists ? '✅' : '❌'} Custodial wallet exists`);

  // Check 3: Environment variables
  const hasLicenseContract = !!process.env.NEXT_PUBLIC_LICENSE_CONTRACT;
  checks.push({ name: 'LICENSE contract configured', status: hasLicenseContract });
  console.log(`${hasLicenseContract ? '✅' : '⚠️ '} LICENSE contract ${hasLicenseContract ? 'configured' : 'not configured (optional)'}`);

  const hasMintingWallet = !!process.env.MINTING_WALLET_PRIVATE_KEY;
  checks.push({ name: 'Minting wallet configured', status: hasMintingWallet });
  console.log(`${hasMintingWallet ? '✅' : '❌'} Minting wallet configured`);

  const hasThirdwebKey = !!process.env.THIRDWEB_SECRET_KEY;
  checks.push({ name: 'Thirdweb API key configured', status: hasThirdwebKey });
  console.log(`${hasThirdwebKey ? '✅' : '❌'} Thirdweb API key configured`);

  const allCriticalChecks = userExists && walletExists && hasMintingWallet && hasThirdwebKey;

  return { allCriticalChecks, checks };
}

async function main() {
  try {
    // Step 1: Find or create user
    const userId = await findOrCreateTestUser();

    if (!userId) {
      console.log('\n❌ Could not find or create a test user');
      console.log('\n📝 Next Steps:');
      console.log('1. Create a user through your app\'s signup process');
      console.log('2. Or manually insert a user into the profiles table');
      console.log('3. Then run this script again');
      process.exit(1);
    }

    // Step 2: Setup wallet
    const walletAddress = await setupCustodialWallet(userId);

    if (!walletAddress) {
      console.log('\n❌ Could not create custodial wallet');
      console.log('\n📝 Check that WALLET_ENCRYPTION_KEY is set in .env.local');
      process.exit(1);
    }

    // Step 3: Verify setup
    const { allCriticalChecks } = await verifyTestSetup(userId);

    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('SETUP COMPLETE!');
    console.log('='.repeat(70));
    console.log();
    console.log('Your test environment is ready. Use this command to run tests:');
    console.log();
    console.log(`  TEST_USER_ID=${userId} node test-mint-license.js`);
    console.log();
    console.log('Or on Windows (PowerShell):');
    console.log();
    console.log(`  $env:TEST_USER_ID="${userId}"; node test-mint-license.js`);
    console.log();
    console.log('Or add to .env.local:');
    console.log();
    console.log(`  TEST_USER_ID=${userId}`);
    console.log();

    if (!allCriticalChecks) {
      console.log('⚠️  WARNING: Some environment variables are missing');
      console.log('   Tests may fail without proper configuration');
      console.log('   See the checklist above for missing items');
      console.log();
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
