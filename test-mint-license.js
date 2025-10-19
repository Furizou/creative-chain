/**
 * Simple test script for License Minting API
 *
 * Usage: node test-mint-license.js
 *
 * Make sure to set environment variables:
 * - TEST_USER_ID: UUID of a user with a custodial wallet
 * - NEXT_PUBLIC_API_URL (optional): API base URL, defaults to http://localhost:3000
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

// Load .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MINT_LICENSE_ENDPOINT = `${API_BASE_URL}/api/blockchain/mint-license`;
const TEST_USER_ID = process.env.TEST_USER_ID;

console.log('='.repeat(60));
console.log('LICENSE MINTING API TEST');
console.log('='.repeat(60));
console.log(`API Endpoint: ${MINT_LICENSE_ENDPOINT}`);
console.log(`Test User ID: ${TEST_USER_ID || 'NOT SET'}`);
console.log('='.repeat(60));
console.log();

if (!TEST_USER_ID) {
  console.error('❌ ERROR: TEST_USER_ID environment variable is required');
  console.log('\nPlease set TEST_USER_ID to a valid user UUID that has a custodial wallet.');
  console.log('Example: TEST_USER_ID=your-user-uuid node test-mint-license.js');
  process.exit(1);
}

// Test scenarios
const testScenarios = [
  {
    name: 'Personal License (Perpetual, Unlimited)',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'personal',
      workTitle: 'Test Song - Personal Use',
      creatorName: 'Test Artist',
      terms: 'Personal use only, non-commercial, non-transferable. You may use this work for personal enjoyment.',
      priceUsdt: 50.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
      usageLimit: null,
      expiryDate: null
    }
  },
  {
    name: 'Commercial Event License (24 hours, Single Use)',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'commercial_event',
      workTitle: 'Event Background Music',
      creatorName: 'Event Music Producer',
      terms: 'Single event use only. License expires 24 hours after purchase. Non-transferable.',
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 1,
      priceUsdt: 500.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
    }
  },
  {
    name: 'Broadcast License (1 year, Unlimited)',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'broadcast_1year',
      workTitle: 'Broadcast Jingle',
      creatorName: 'Jingle Creator',
      terms: 'Broadcast rights for radio and TV. Valid for 1 year from purchase date. Unlimited broadcasts during validity period.',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: null,
      priceUsdt: 5000.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
    }
  },
  {
    name: 'Exclusive License (Perpetual, Unlimited)',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'exclusive',
      workTitle: 'Exclusive Rights Track',
      creatorName: 'Original Creator',
      terms: 'Exclusive rights to use, modify, and distribute this work. Perpetual license. Full commercial rights included.',
      priceUsdt: 50000.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
      usageLimit: null,
      expiryDate: null
    }
  }
];

// Validation test cases
const validationTests = [
  {
    name: 'Missing Required Fields',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseType: 'personal'
      // Missing other required fields
    },
    expectedError: 'MISSING_FIELDS'
  },
  {
    name: 'Invalid License Type',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'invalid_type',
      workTitle: 'Test',
      creatorName: 'Test',
      terms: 'Test',
      priceUsdt: 100.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
    },
    expectedError: 'INVALID_LICENSE_TYPE'
  },
  {
    name: 'Past Expiry Date',
    data: {
      buyerUserId: TEST_USER_ID,
      workId: crypto.randomUUID(),
      licenseOfferingId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      licenseType: 'personal',
      workTitle: 'Test',
      creatorName: 'Test',
      terms: 'Test',
      expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priceUsdt: 100.00,
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
    },
    expectedError: 'INVALID_DATE'
  }
];

async function testMintLicense(scenario) {
  console.log(`\n📋 Testing: ${scenario.name}`);
  console.log('-'.repeat(60));
  console.log('Request data:', JSON.stringify(scenario.data, null, 2));
  console.log();

  try {
    const response = await fetch(MINT_LICENSE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario.data)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`  License ID: ${data.licenseId}`);
      console.log(`  Token ID: ${data.tokenId}`);
      console.log(`  Transaction Hash: ${data.transactionHash}`);
      console.log(`  Polygonscan: ${data.polygonscanUrl}`);
      console.log(`  Wallet: ${data.walletAddress}`);
      console.log(`  License Type: ${data.licenseDetails.type}`);
      console.log(`  Expiry: ${data.licenseDetails.expiryDate || 'Perpetual'}`);
      console.log(`  Usage Limit: ${data.licenseDetails.usageLimit || 'Unlimited'}`);
      return { success: true, data };
    } else {
      if (scenario.expectedError && data.error === scenario.expectedError) {
        console.log('\n✅ VALIDATION WORKING (Expected error received)');
        console.log(`  Error: ${data.error}`);
        console.log(`  Message: ${data.message}`);
        return { success: true, validation: true };
      } else {
        console.log('\n❌ FAILED');
        console.log(`  Error: ${data.error}`);
        console.log(`  Message: ${data.message}`);
        return { success: false, error: data };
      }
    }
  } catch (error) {
    console.log('\n❌ REQUEST FAILED');
    console.error(`  Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 RUNNING VALIDATION TESTS');
  console.log('='.repeat(60));

  const validationResults = [];
  for (const test of validationTests) {
    const result = await testMintLicense(test);
    validationResults.push({ name: test.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
  }

  console.log('\n\n🚀 RUNNING MINTING TESTS');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: These tests will mint actual NFTs on the blockchain!');
  console.log('Each test may take 30-60 seconds to complete...');

  const mintResults = [];
  for (const scenario of testScenarios) {
    const result = await testMintLicense(scenario);
    mintResults.push({ name: scenario.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between blockchain txs
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  console.log('\n📊 Validation Tests:');
  validationResults.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}`);
  });

  console.log('\n📊 Minting Tests:');
  mintResults.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}`);
  });

  const totalTests = validationResults.length + mintResults.length;
  const passedTests = [...validationResults, ...mintResults].filter(r => r.success).length;

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(60));

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
