/**
 * Quick script to check your database status
 * Shows what you have in the database to help with testing
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseStatus() {
  console.log('\n========================================');
  console.log('Database Status Check');
  console.log('========================================\n');

  console.log('Connected to:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('');

  // Check custodial wallets
  console.log('📁 Checking custodial_wallets table...');
  const { data: wallets, error: walletError } = await supabase
    .from('custodial_wallets')
    .select('id, user_id, wallet_address, blockchain, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (walletError) {
    console.log('❌ Error:', walletError.message);
  } else if (!wallets || wallets.length === 0) {
    console.log('   No wallets found');
    console.log('   ℹ️  You need to create custodial wallets for users before minting\n');
  } else {
    console.log(`   ✅ Found ${wallets.length} wallet(s)\n`);
    wallets.forEach((wallet, i) => {
      console.log(`   Wallet ${i + 1}:`);
      console.log(`     User ID: ${wallet.user_id}`);
      console.log(`     Address: ${wallet.wallet_address}`);
      console.log(`     Network: ${wallet.blockchain}`);
      console.log(`     Created: ${new Date(wallet.created_at).toLocaleString()}`);
      console.log('');
    });
  }

  // Check certificates
  console.log('📜 Checking copyright_certificates table...');
  const { data: certs, error: certError } = await supabase
    .from('copyright_certificates')
    .select('id, user_id, token_id, transaction_hash, minting_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (certError) {
    console.log('❌ Error:', certError.message);
  } else if (!certs || certs.length === 0) {
    console.log('   No certificates found');
    console.log('   ℹ️  Ready to mint your first certificate!\n');
  } else {
    console.log(`   ✅ Found ${certs.length} certificate(s)\n`);
    certs.forEach((cert, i) => {
      console.log(`   Certificate ${i + 1}:`);
      console.log(`     ID: ${cert.id}`);
      console.log(`     Token ID: ${cert.token_id}`);
      console.log(`     Status: ${cert.minting_status}`);
      console.log(`     Transaction: ${cert.transaction_hash?.substring(0, 20)}...`);
      console.log(`     Created: ${new Date(cert.created_at).toLocaleString()}`);
      console.log('');
    });

    // Show status breakdown
    const statusCounts = certs.reduce((acc, cert) => {
      acc[cert.minting_status] = (acc[cert.minting_status] || 0) + 1;
      return acc;
    }, {});

    console.log('   Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });
    console.log('');
  }

  // Summary and recommendations
  console.log('========================================');
  console.log('Summary & Recommendations');
  console.log('========================================\n');

  const hasWallets = wallets && wallets.length > 0;
  const hasCerts = certs && certs.length > 0;
  const hasConfirmedCerts = certs?.some(c => c.minting_status === 'confirmed');

  if (!hasWallets) {
    console.log('⚠️  No custodial wallets found');
    console.log('   Action: Create a wallet for a user first');
    console.log('   See: wallet-manager.js or use the wallet creation API\n');
  } else {
    console.log('✅ Custodial wallets exist');
  }

  if (!hasCerts) {
    console.log('📝 No certificates minted yet');
    console.log('   Action: Ready to mint your first certificate!');
    console.log('   Run: node setup-test-mint.js');
    console.log('   Or see: HOW_TO_MINT_CERTIFICATE.md\n');
  } else {
    console.log('✅ Certificates exist in database');

    if (!hasConfirmedCerts) {
      console.log('⚠️  No confirmed certificates found');
      console.log('   Check if minting is working correctly\n');
    } else {
      console.log('✅ Confirmed certificates available for testing');
      console.log('   Action: Test verification API');
      console.log('   Run: node test-verify-api.js\n');
    }
  }

  // Show next steps
  if (hasWallets && hasCerts && hasConfirmedCerts) {
    console.log('🎉 Your database is ready for testing!\n');
    console.log('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Test verification: node test-verify-api.js');
    console.log('3. Or verify manually with cURL (see docs)\n');

    // Show example verification commands
    const exampleCert = certs.find(c => c.minting_status === 'confirmed');
    if (exampleCert) {
      console.log('Example verification commands:');
      console.log(`  curl "http://localhost:3000/api/blockchain/verify-certificate?tokenId=${exampleCert.token_id}"`);
      console.log(`  curl "http://localhost:3000/api/blockchain/verify-certificate?tx=${exampleCert.transaction_hash}"`);
    }
  } else if (hasWallets && !hasCerts) {
    console.log('🚀 Ready to mint certificates!\n');
    console.log('Quick start:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Run: node setup-test-mint.js');
    console.log('   (This will mint a test certificate automatically)');
  } else if (!hasWallets) {
    console.log('⚙️  Setup needed\n');
    console.log('You need to:');
    console.log('1. Create a user (via your auth system)');
    console.log('2. Create a custodial wallet for that user');
    console.log('3. Then you can mint certificates');
  }

  console.log('\n========================================\n');
}

checkDatabaseStatus().catch(console.error);
