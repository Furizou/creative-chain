/**
 * Helper script to set up and mint a test certificate
 * This script will:
 * 1. Find an existing user in your database
 * 2. Check if they have a wallet (create if needed)
 * 3. Mint a test certificate
 * 4. Verify the certificate
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function setupAndMint() {
  console.log('\n========================================');
  console.log('Certificate Minting Setup & Test');
  console.log('========================================\n');

  try {
    // Step 1: Find a user
    console.log('1. Finding a user in the database...');
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);

    if (userError) {
      console.error('Error querying users:', userError.message);
      console.log('\nTrying alternative query...');

      // Try getting from custodial_wallets instead
      const { data: wallets } = await supabase
        .from('custodial_wallets')
        .select('user_id')
        .limit(1);

      if (wallets && wallets.length > 0) {
        const userId = wallets[0].user_id;
        console.log(`✅ Found user from wallets: ${userId}\n`);
        await mintCertificate(userId);
        return;
      }

      console.log('\n❌ Could not find any users in the database.');
      console.log('\nTo mint a certificate, you need:');
      console.log('1. A user in your auth.users table');
      console.log('2. A custodial wallet for that user');
      console.log('\nYou can:');
      console.log('- Sign up through your app to create a user');
      console.log('- Create a user manually in Supabase Dashboard');
      console.log('- Use the wallet-manager to create a test wallet');
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database.\n');
      console.log('Please create a user first through your authentication system.');
      return;
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.email || user.id}\n`);

    // Step 2: Check if user has a wallet
    console.log('2. Checking for custodial wallet...');
    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!wallet) {
      console.log('❌ User does not have a custodial wallet.');
      console.log('\nYou need to create a wallet first. Options:');
      console.log('1. Use the wallet-manager API to create one');
      console.log('2. Create one through your app\'s wallet creation flow');
      console.log('\nCannot proceed with minting without a wallet.');
      return;
    }

    console.log(`✅ Found wallet: ${wallet.wallet_address}\n`);

    // Step 3: Mint certificate
    await mintCertificate(user.id);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function mintCertificate(userId) {
  console.log('3. Minting test certificate...');

  // Generate a test work hash
  const testWorkHash = 'a'.repeat(64);

  const mintData = {
    userId,
    workId: `test-work-${Date.now()}`,
    workTitle: 'Test Creative Work',
    workDescription: 'A test certificate for verifying the blockchain certification system',
    workHash: testWorkHash,
    category: 'art',
    creatorName: 'Test Creator'
  };

  console.log('Sending mint request...');
  console.log('Data:', JSON.stringify(mintData, null, 2));

  try {
    const response = await fetch(`${API_BASE}/api/blockchain/mint-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mintData)
    });

    const result = await response.json();

    if (!result.success) {
      console.log('\n❌ Minting failed!');
      console.log('Error:', result.error);
      console.log('Message:', result.message);

      if (result.error === 'NO_WALLET') {
        console.log('\nThe user needs a custodial wallet. Please create one first.');
      } else if (result.error === 'CERTIFICATE_EXISTS') {
        console.log('\nThis work already has a certificate!');
        console.log('Existing certificate:', result.existingCertificate);
        console.log('\nLet\'s verify it instead...\n');
        await verifyCertificate(result.existingCertificate.tokenId);
      }

      return;
    }

    console.log('\n✅ Certificate minted successfully!\n');
    console.log('Certificate Details:');
    console.log('-------------------');
    console.log('Certificate ID:', result.certificateId);
    console.log('Token ID:', result.tokenId);
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Wallet Address:', result.walletAddress);
    console.log('Polygonscan URL:', result.polygonscanUrl);
    console.log('Minted At:', result.mintedAt);
    console.log('Status:', result.status);

    console.log('\n📋 Save these values for verification:\n');
    console.log(`Token ID: ${result.tokenId}`);
    console.log(`Transaction Hash: ${result.transactionHash}`);

    // Step 4: Wait and verify
    console.log('\n4. Waiting 5 seconds for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    await verifyCertificate(result.tokenId);

  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      console.log('\n❌ Cannot connect to API server.');
      console.log('Please start the development server first:');
      console.log('  npm run dev\n');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  }
}

async function verifyCertificate(tokenId) {
  console.log('\n5. Verifying certificate...');

  try {
    const response = await fetch(
      `${API_BASE}/api/blockchain/verify-certificate?tokenId=${tokenId}`
    );

    const result = await response.json();

    console.log('\n✅ Verification complete!\n');
    console.log('Verification Result:');
    console.log('-------------------');
    console.log('Verified:', result.verified ? '✅ YES' : '❌ NO');
    console.log('Status:', result.status);

    if (result.certificate) {
      console.log('\nWork Details:');
      console.log('  Title:', result.certificate.workDetails.title);
      console.log('  Creator:', result.certificate.workDetails.creator);
      console.log('  Category:', result.certificate.workDetails.category);
      console.log('  Work Hash:', result.certificate.workDetails.workHash);

      console.log('\nBlockchain Data:');
      console.log('  Owner:', result.certificate.blockchainData.currentOwner);
      console.log('  Network:', result.certificate.blockchainData.network);

      console.log('\nVerification Checks:');
      console.log('  Token Exists:', result.certificate.verification.tokenExists ? '✅' : '❌');
      console.log('  Ownership Match:', result.certificate.verification.ownershipMatch ? '✅' : '❌');
      console.log('  Metadata Match:', result.certificate.verification.metadataMatch ? '✅' : '❌');
      console.log('  Hash Match:', result.certificate.verification.hashMatch ? '✅' : '❌');

      console.log('\nPolygonscan URL:', result.polygonscanUrl);
    }

    if (result.issues && result.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      result.issues.forEach(issue => console.log('  -', issue));
    }

    console.log('\n========================================');
    console.log('🎉 Setup and test complete!');
    console.log('========================================\n');

    console.log('You can now:');
    console.log('1. Run the full test suite: node test-verify-api.js');
    console.log('2. Mint more certificates using the API');
    console.log('3. Verify certificates by tx, tokenId, workHash, or certificateId');
    console.log('\nSee HOW_TO_MINT_CERTIFICATE.md for more examples.\n');

  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

// Run the setup
setupAndMint().catch(console.error);
