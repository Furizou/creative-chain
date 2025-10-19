/**
 * Test suite for License NFT Minting API
 *
 * Tests the /api/blockchain/mint-license endpoint
 *
 * Run with: npm test src/tests/mint-license-api.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MINT_LICENSE_ENDPOINT = `${API_BASE_URL}/api/blockchain/mint-license`;

// Create Supabase admin client for setup/teardown
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

// Test user and data
let testUserId;
let testWalletAddress;
let mintedLicenseId;
let mintedTokenId;
let mintedTransactionHash;

describe('License NFT Minting API', () => {

  beforeAll(async () => {
    console.log('Setting up test environment...');

    // Create test user (or use existing)
    // For this test, we'll use a mock UUID
    testUserId = process.env.TEST_USER_ID || crypto.randomUUID();

    // Check if test user has a wallet, get address
    const { data: wallet } = await supabaseAdmin
      .from('custodial_wallets')
      .select('wallet_address')
      .eq('user_id', testUserId)
      .single();

    if (wallet) {
      testWalletAddress = wallet.wallet_address;
      console.log(`Using existing test wallet: ${testWalletAddress}`);
    } else {
      console.log('Note: Test user does not have a wallet. Some tests will fail.');
      console.log('Create a wallet first using the wallet-manager API or set TEST_USER_ID env var.');
    }
  });

  afterAll(async () => {
    console.log('\nCleaning up test data...');

    // Optionally clean up test licenses (be careful in production!)
    if (mintedLicenseId && process.env.CLEANUP_TEST_DATA === 'true') {
      await supabaseAdmin
        .from('licenses')
        .delete()
        .eq('id', mintedLicenseId);
      console.log(`Deleted test license: ${mintedLicenseId}`);
    }
  });

  // ==========================================
  // VALIDATION TESTS
  // ==========================================

  describe('Input Validation', () => {

    it('should reject request with missing required fields', async () => {
      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          // Missing other required fields
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should reject invalid license type', async () => {
      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'invalid_type',
          workTitle: 'Test Song',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_LICENSE_TYPE');
    });

    it('should reject invalid expiry date format', async () => {
      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'personal',
          workTitle: 'Test Song',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          expiryDate: 'not-a-date',
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_DATE');
    });

    it('should reject expiry date in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'personal',
          workTitle: 'Test Song',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          expiryDate: pastDate.toISOString(),
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_DATE');
    });

    it('should reject invalid usage limit', async () => {
      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'personal',
          workTitle: 'Test Song',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          usageLimit: -5,
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_USAGE_LIMIT');
    });

    it('should reject buyer without wallet', async () => {
      const fakeUserId = crypto.randomUUID();

      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: fakeUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'personal',
          workTitle: 'Test Song',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('WALLET_NOT_FOUND');
    });
  });

  // ==========================================
  // SUCCESSFUL MINTING TESTS
  // ==========================================

  describe('Successful License Minting', () => {

    it('should mint a personal license successfully', async () => {
      if (!testWalletAddress) {
        console.log('Skipping: No test wallet available');
        return;
      }

      const orderId = crypto.randomUUID();

      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: orderId,
          licenseType: 'personal',
          workTitle: 'Lagu Cinta',
          creatorName: 'John Doe',
          terms: 'Personal use only, non-commercial, non-transferable',
          purchaseAmount: 50000,
          usageLimit: null,
          expiryDate: null
        })
      });

      const data = await response.json();

      console.log('Mint response:', JSON.stringify(data, null, 2));

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.licenseId).toBeDefined();
      expect(data.tokenId).toBeDefined();
      expect(data.transactionHash).toBeDefined();
      expect(data.walletAddress).toBe(testWalletAddress);
      expect(data.licenseDetails).toBeDefined();
      expect(data.licenseDetails.type).toBe('personal');
      expect(data.licenseDetails.workTitle).toBe('Lagu Cinta');
      expect(data.metadata).toBeDefined();

      // Save for later tests
      mintedLicenseId = data.licenseId;
      mintedTokenId = data.tokenId;
      mintedTransactionHash = data.transactionHash;
    }, 60000); // 60s timeout for blockchain tx

    it('should mint a commercial event license with expiry and usage limit', async () => {
      if (!testWalletAddress) {
        console.log('Skipping: No test wallet available');
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: crypto.randomUUID(),
          licenseType: 'commercial_event',
          workTitle: 'Event Theme Song',
          creatorName: 'Jane Smith',
          terms: 'Single event use, non-transferable',
          expiryDate: futureDate.toISOString(),
          usageLimit: 1,
          purchaseAmount: 500000
        })
      });

      const data = await response.json();

      console.log('Event license response:', JSON.stringify(data, null, 2));

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.licenseDetails.type).toBe('commercial_event');
      expect(data.licenseDetails.usageLimit).toBe(1);
      expect(data.licenseDetails.expiryDate).toBe(futureDate.toISOString());
    }, 60000);

    it('should prevent duplicate license for same order', async () => {
      if (!mintedLicenseId) {
        console.log('Skipping: No previous license minted');
        return;
      }

      // Get the order ID from the first test
      const { data: license } = await supabaseAdmin
        .from('licenses')
        .select('order_id')
        .eq('id', mintedLicenseId)
        .single();

      if (!license) {
        console.log('Skipping: Could not fetch order ID');
        return;
      }

      const response = await fetch(MINT_LICENSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: testUserId,
          licenseOfferingId: crypto.randomUUID(),
          orderId: license.order_id,
          licenseType: 'personal',
          workTitle: 'Duplicate Test',
          creatorName: 'Test Artist',
          terms: 'Test terms',
          purchaseAmount: 100000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('LICENSE_EXISTS');
      expect(data.existingLicense).toBeDefined();
    });
  });

  // ==========================================
  // GET ENDPOINT TESTS
  // ==========================================

  describe('License Retrieval', () => {

    it('should retrieve license by ID', async () => {
      if (!mintedLicenseId) {
        console.log('Skipping: No license to retrieve');
        return;
      }

      const response = await fetch(`${MINT_LICENSE_ENDPOINT}?licenseId=${mintedLicenseId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.license).toBeDefined();
      expect(data.license.id).toBe(mintedLicenseId);
    });

    it('should retrieve license by token ID', async () => {
      if (!mintedTokenId) {
        console.log('Skipping: No token ID to query');
        return;
      }

      const response = await fetch(`${MINT_LICENSE_ENDPOINT}?tokenId=${mintedTokenId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.license.token_id).toBe(mintedTokenId);
    });

    it('should retrieve all licenses for a buyer', async () => {
      const response = await fetch(`${MINT_LICENSE_ENDPOINT}?buyerUserId=${testUserId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.licenses).toBeDefined();
      expect(Array.isArray(data.licenses)).toBe(true);
    });

    it('should return 404 for non-existent license', async () => {
      const fakeId = crypto.randomUUID();
      const response = await fetch(`${MINT_LICENSE_ENDPOINT}?licenseId=${fakeId}`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('should require at least one query parameter', async () => {
      const response = await fetch(MINT_LICENSE_ENDPOINT);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_PARAMS');
    });
  });

  // ==========================================
  // DATABASE VERIFICATION TESTS
  // ==========================================

  describe('Database Integrity', () => {

    it('should have valid database record after minting', async () => {
      if (!mintedLicenseId) {
        console.log('Skipping: No license to verify');
        return;
      }

      const { data: license, error } = await supabaseAdmin
        .from('licenses')
        .select('*')
        .eq('id', mintedLicenseId)
        .single();

      expect(error).toBeNull();
      expect(license).toBeDefined();
      expect(license.buyer_user_id).toBe(testUserId);
      expect(license.token_id).toBe(mintedTokenId);
      expect(license.transaction_hash).toBe(mintedTransactionHash);
      expect(license.is_valid).toBe(true);
      expect(license.usage_count).toBe(0);
      expect(license.metadata).toBeDefined();
      expect(typeof license.metadata).toBe('object');
    });

    it('should have properly formatted metadata', async () => {
      if (!mintedLicenseId) {
        console.log('Skipping: No license to verify');
        return;
      }

      const { data: license } = await supabaseAdmin
        .from('licenses')
        .select('metadata')
        .eq('id', mintedLicenseId)
        .single();

      expect(license.metadata.name).toBeDefined();
      expect(license.metadata.description).toBeDefined();
      expect(license.metadata.attributes).toBeDefined();
      expect(Array.isArray(license.metadata.attributes)).toBe(true);
      expect(license.metadata.license_terms).toBeDefined();
      expect(license.metadata.platform).toBe('CreativeChain');
    });
  });
});

// ==========================================
// MANUAL TEST HELPER
// ==========================================

/**
 * Run this file directly to execute manual tests
 * Usage: node src/tests/mint-license-api.test.js
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running manual license minting test...\n');

  // Example test data
  const testData = {
    buyerUserId: process.env.TEST_USER_ID,
    licenseOfferingId: crypto.randomUUID(),
    orderId: crypto.randomUUID(),
    licenseType: 'commercial_event',
    workTitle: 'Lagu Cinta Manual Test',
    creatorName: 'Manual Test Artist',
    terms: 'Single event use, non-transferable, expires in 24 hours',
    expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 1,
    purchaseAmount: 500000
  };

  console.log('Test data:', JSON.stringify(testData, null, 2));
  console.log('\nSending request to:', MINT_LICENSE_ENDPOINT);

  fetch(MINT_LICENSE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
    .then(res => res.json())
    .then(data => {
      console.log('\nResponse:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('\n✅ License minted successfully!');
        console.log(`License ID: ${data.licenseId}`);
        console.log(`Token ID: ${data.tokenId}`);
        console.log(`Transaction: ${data.polygonscanUrl}`);
      } else {
        console.log('\n❌ Minting failed:', data.error);
        console.log('Message:', data.message);
      }
    })
    .catch(err => {
      console.error('\n❌ Request failed:', err.message);
    });
}
