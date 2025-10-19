/**
 * Manual test script for certificate verification API
 * Run this script to test the verification endpoint with various inputs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const VERIFY_ENDPOINT = `${API_BASE}/api/blockchain/verify-certificate`;

async function testVerificationAPI() {
  console.log('\n========================================');
  console.log('Certificate Verification API Test');
  console.log('========================================\n');

  // First, find a real certificate to test with
  console.log('1. Finding existing certificates in database...');
  const { data: certificates, error } = await supabase
    .from('copyright_certificates')
    .select('*')
    .eq('minting_status', 'confirmed')
    .limit(1);

  if (error) {
    console.error('Error fetching certificates:', error);
    return;
  }

  if (!certificates || certificates.length === 0) {
    console.log('\nNo confirmed certificates found in database.');
    console.log('Please mint a certificate first using /api/blockchain/mint-certificate\n');

    // Test validation with fake data
    console.log('2. Testing input validation with invalid data...\n');
    await testValidation();
    return;
  }

  const cert = certificates[0];
  console.log(`Found certificate:
  - Token ID: ${cert.token_id}
  - Transaction: ${cert.transaction_hash}
  - Work Hash: ${cert.metadata?.work_hash || 'N/A'}
  - Certificate ID: ${cert.id}
`);

  // Test 1: Verify by transaction hash
  console.log('2. Testing verification by transaction hash...');
  const test1 = await fetch(`${VERIFY_ENDPOINT}?tx=${cert.transaction_hash}`);
  const result1 = await test1.json();
  console.log(`Status: ${test1.status} - ${result1.status}`);
  console.log(`Verified: ${result1.verified}`);
  if (result1.certificate) {
    console.log(`Token exists on blockchain: ${result1.certificate.verification?.tokenExists}`);
    console.log(`Ownership match: ${result1.certificate.verification?.ownershipMatch}`);
  }
  console.log('');

  // Test 2: Verify by token ID
  console.log('3. Testing verification by token ID...');
  const test2 = await fetch(`${VERIFY_ENDPOINT}?tokenId=${cert.token_id}`);
  const result2 = await test2.json();
  console.log(`Status: ${test2.status} - ${result2.status}`);
  console.log(`Verified: ${result2.verified}`);
  console.log('');

  // Test 3: Verify by work hash (if available)
  if (cert.metadata?.work_hash) {
    console.log('4. Testing verification by work hash...');
    const test3 = await fetch(`${VERIFY_ENDPOINT}?workHash=${cert.metadata.work_hash}`);
    const result3 = await test3.json();
    console.log(`Status: ${test3.status} - ${result3.status}`);
    console.log(`Verified: ${result3.verified}`);
    console.log('');
  }

  // Test 4: Verify by certificate ID
  console.log('5. Testing verification by certificate ID...');
  const test4 = await fetch(`${VERIFY_ENDPOINT}?certificateId=${cert.id}`);
  const result4 = await test4.json();
  console.log(`Status: ${test4.status} - ${result4.status}`);
  console.log(`Verified: ${result4.verified}`);
  if (result4.polygonscanUrl) {
    console.log(`Polygonscan URL: ${result4.polygonscanUrl}`);
  }
  console.log('');

  // Test 5: POST method
  console.log('6. Testing POST method with tokenId...');
  const test5 = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId: cert.token_id })
  });
  const result5 = await test5.json();
  console.log(`Status: ${test5.status} - ${result5.status}`);
  console.log(`Verified: ${result5.verified}`);
  console.log('');

  // Test validation
  console.log('7. Testing input validation...\n');
  await testValidation();

  console.log('\n========================================');
  console.log('Full response example:');
  console.log('========================================');
  console.log(JSON.stringify(result1, null, 2));

  console.log('\n========================================');
  console.log('Tests completed!');
  console.log('========================================\n');
}

async function testValidation() {
  try {
    // Test: No parameters
    console.log('  - Testing with no parameters...');
    const test1 = await fetch(VERIFY_ENDPOINT);
    const result1 = await test1.json();
    console.log(`    Result: ${result1.status} - ${result1.message}`);
  } catch (error) {
    console.log(`\n❌ Error: Cannot connect to API endpoint at ${VERIFY_ENDPOINT}`);
    console.log('Please start the development server first:');
    console.log('  npm run dev\n');
    console.log('Then run this test script again in another terminal.\n');
    return;
  }

  // Test: Invalid tx hash
  console.log('  - Testing with invalid transaction hash...');
  const test2 = await fetch(`${VERIFY_ENDPOINT}?tx=invalid`);
  const result2 = await test2.json();
  console.log(`    Result: ${result2.status} - ${result2.message}`);

  // Test: Invalid token ID
  console.log('  - Testing with non-numeric token ID...');
  const test3 = await fetch(`${VERIFY_ENDPOINT}?tokenId=abc`);
  const result3 = await test3.json();
  console.log(`    Result: ${result3.status} - ${result3.message}`);

  // Test: Multiple parameters
  console.log('  - Testing with multiple parameters...');
  const test4 = await fetch(`${VERIFY_ENDPOINT}?tx=0x${'a'.repeat(64)}&tokenId=1`);
  const result4 = await test4.json();
  console.log(`    Result: ${result4.status} - ${result4.message}`);

  // Test: Not found
  console.log('  - Testing with non-existent token ID...');
  const test5 = await fetch(`${VERIFY_ENDPOINT}?tokenId=999999999`);
  const result5 = await test5.json();
  console.log(`    Result: ${result5.status} - ${result5.message}`);
  console.log('');
}

// Run tests
testVerificationAPI().catch(console.error);
