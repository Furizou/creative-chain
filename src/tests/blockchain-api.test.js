/**
 * Blockchain API Tests
 *
 * Tests NFT copyright certificate minting endpoints
 * Creates and cleans up test users automatically
 *
 * Run with: npm run test:blockchain-api
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env.local');

config({ path: envPath });

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Check environment - use actual values from .env.local
// Database integration tests require real Supabase connection
const hasSupabaseConfig = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!hasSupabaseConfig) {
  console.warn('\n⚠️  Warning: Supabase environment variables not set');
  console.warn('Database integration tests will be skipped');
  console.warn('Checked .env.local at:', envPath);
  console.warn('To run all tests, ensure .env.local has:');
  console.warn('  - NEXT_PUBLIC_SUPABASE_URL');
  console.warn('  - SUPABASE_SERVICE_ROLE_KEY\n');
} else {
  console.log('\n✅ Supabase configuration loaded from .env.local');
  console.log('Database integration tests will run\n');
}

// Import functions to test
import {
  createNFTMetadata,
  isValidSHA256,
  isValidCategory,
  createCertificateRecord
} from '../lib/blockchain-minting.js';

// Create Supabase admin client for test user management (only if config available)
const supabaseAdmin = hasSupabaseConfig ? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// Test data
const testUsers = [];
const testCertificates = [];

// Helper: Generate random email
function generateTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
}

// Helper: Create test user
async function createTestUser() {
  const email = generateTestEmail();
  const password = 'TestPassword123!';

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) throw error;

    testUsers.push(data.user.id);
    console.log(`Created test user: ${data.user.id}`);
    return data.user;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

// Helper: Delete test user
async function deleteTestUser(userId) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error(`Failed to delete user ${userId}:`, error);
    } else {
      console.log(`Deleted test user: ${userId}`);
    }
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
  }
}

// Helper: Generate valid SHA-256 hash
function generateValidHash() {
  return crypto.randomBytes(32).toString('hex');
}

// Cleanup function
async function cleanup() {
  console.log('\nCleaning up test data...');

  // Delete test certificates
  if (testCertificates.length > 0) {
    try {
      await supabaseAdmin
        .from('copyright_certificates')
        .delete()
        .in('id', testCertificates);
      console.log(`Deleted ${testCertificates.length} test certificates`);
    } catch (error) {
      console.error('Failed to delete test certificates:', error);
    }
  }

  // Delete test users (this will cascade delete wallets and certificates)
  for (const userId of testUsers) {
    await deleteTestUser(userId);
  }

  console.log('Cleanup complete\n');
}

// ============================================
// VALIDATION TESTS
// ============================================

describe('Blockchain API - Validation Functions', () => {
  test('isValidSHA256 should validate correct hashes', () => {
    const validHash = 'a'.repeat(64);
    assert.strictEqual(isValidSHA256(validHash), true, 'Should accept 64 hex chars');

    const upperCaseHash = 'A'.repeat(64);
    assert.strictEqual(isValidSHA256(upperCaseHash), true, 'Should accept uppercase hex');

    const mixedHash = 'aAbBcC123456' + 'd'.repeat(52);
    assert.strictEqual(isValidSHA256(mixedHash), true, 'Should accept mixed case hex');
  });

  test('isValidSHA256 should reject invalid hashes', () => {
    assert.strictEqual(isValidSHA256('too-short'), false, 'Should reject short strings');
    assert.strictEqual(isValidSHA256('a'.repeat(63)), false, 'Should reject 63 chars');
    assert.strictEqual(isValidSHA256('a'.repeat(65)), false, 'Should reject 65 chars');
    assert.strictEqual(isValidSHA256('g'.repeat(64)), false, 'Should reject non-hex chars');
    assert.strictEqual(isValidSHA256(null), false, 'Should reject null');
    assert.strictEqual(isValidSHA256(undefined), false, 'Should reject undefined');
    assert.strictEqual(isValidSHA256(123), false, 'Should reject numbers');
  });

  test('isValidCategory should validate correct categories', () => {
    const validCategories = ['music', 'art', 'video', 'writing', 'design', 'other'];

    validCategories.forEach(category => {
      assert.strictEqual(
        isValidCategory(category),
        true,
        `Should accept ${category}`
      );
    });

    // Test case insensitive
    assert.strictEqual(isValidCategory('MUSIC'), true, 'Should accept uppercase');
    assert.strictEqual(isValidCategory('Music'), true, 'Should accept mixed case');
  });

  test('isValidCategory should reject invalid categories', () => {
    assert.strictEqual(isValidCategory('invalid'), false, 'Should reject invalid category');
    assert.strictEqual(isValidCategory('photo'), false, 'Should reject unlisted category');
    assert.strictEqual(isValidCategory(null), false, 'Should reject null');
    assert.strictEqual(isValidCategory(''), false, 'Should reject empty string');
  });
});

// ============================================
// METADATA CREATION TESTS
// ============================================

describe('Blockchain API - NFT Metadata Creation', () => {
  test('createNFTMetadata should generate valid metadata structure', () => {
    const params = {
      workTitle: 'Test Song',
      workDescription: 'Original composition',
      workHash: generateValidHash(),
      category: 'music',
      creatorName: 'Test Artist',
      workId: 'work-123'
    };

    const metadata = createNFTMetadata(params);

    assert.ok(metadata.name, 'Should have name');
    assert.ok(metadata.name.includes(params.workTitle), 'Name should include work title');
    assert.ok(metadata.description, 'Should have description');
    assert.ok(metadata.image, 'Should have image');
    assert.ok(metadata.attributes, 'Should have attributes array');
    assert.ok(Array.isArray(metadata.attributes), 'Attributes should be array');
    assert.strictEqual(metadata.work_hash, params.workHash, 'Should include work hash');
    assert.strictEqual(metadata.creator, params.creatorName, 'Should include creator');
    assert.strictEqual(metadata.category, params.category, 'Should include category');
    assert.strictEqual(metadata.platform, 'CreativeChain', 'Should include platform');
  });

  test('createNFTMetadata should include all required attributes', () => {
    const params = {
      workTitle: 'Test Art',
      workDescription: 'Digital artwork',
      workHash: generateValidHash(),
      category: 'art',
      creatorName: 'Artist Name'
    };

    const metadata = createNFTMetadata(params);
    const attributeTypes = metadata.attributes.map(attr => attr.trait_type);

    assert.ok(attributeTypes.includes('Work Hash'), 'Should have Work Hash attribute');
    assert.ok(attributeTypes.includes('Creator'), 'Should have Creator attribute');
    assert.ok(attributeTypes.includes('Category'), 'Should have Category attribute');
    assert.ok(attributeTypes.includes('Registration Date'), 'Should have Registration Date');
    assert.ok(attributeTypes.includes('Platform'), 'Should have Platform attribute');
  });

  test('createNFTMetadata should handle different categories', () => {
    const categories = ['music', 'art', 'video', 'writing', 'design', 'other'];

    categories.forEach(category => {
      const metadata = createNFTMetadata({
        workTitle: 'Test',
        workDescription: 'Test',
        workHash: generateValidHash(),
        category,
        creatorName: 'Test'
      });

      const categoryAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Category'
      );

      assert.ok(categoryAttr, `Should have category attribute for ${category}`);
      assert.strictEqual(
        categoryAttr.value.toLowerCase(),
        category.toLowerCase(),
        `Category should match for ${category}`
      );
    });
  });

  test('createNFTMetadata should include external_url when workId provided', () => {
    const withWorkId = createNFTMetadata({
      workTitle: 'Test',
      workDescription: 'Test',
      workHash: generateValidHash(),
      category: 'music',
      creatorName: 'Test',
      workId: 'work-123'
    });

    assert.ok(
      withWorkId.external_url.includes('work-123'),
      'Should include workId in external_url'
    );

    const withoutWorkId = createNFTMetadata({
      workTitle: 'Test',
      workDescription: 'Test',
      workHash: generateValidHash(),
      category: 'music',
      creatorName: 'Test'
    });

    assert.ok(
      !withoutWorkId.external_url.includes('works'),
      'Should use default URL without workId'
    );
  });

  test('createNFTMetadata should have valid timestamp format', () => {
    const metadata = createNFTMetadata({
      workTitle: 'Test',
      workDescription: 'Test',
      workHash: generateValidHash(),
      category: 'music',
      creatorName: 'Test'
    });

    const timestamp = metadata.created_at;
    assert.ok(timestamp, 'Should have created_at timestamp');

    const date = new Date(timestamp);
    assert.ok(!isNaN(date.getTime()), 'Timestamp should be valid ISO format');
  });
});

// ============================================
// CERTIFICATE RECORD TESTS
// ============================================

describe('Blockchain API - Certificate Record Creation', () => {
  test('createCertificateRecord should generate complete database record', () => {
    const mintResult = {
      tokenId: '123',
      transactionHash: '0xabc123def456',
      blockNumber: 12345,
      gasUsed: '21000',
      status: 'success'
    };

    const metadata = {
      name: 'Test Certificate',
      description: 'Test description'
    };

    const record = createCertificateRecord({
      mintResult,
      metadata,
      userId: 'user-123',
      workId: 'work-456',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F'
    });

    assert.strictEqual(record.creative_work_id, 'work-456', 'Should have workId');
    assert.strictEqual(record.user_id, 'user-123', 'Should have userId');
    assert.strictEqual(record.token_id, '123', 'Should have tokenId');
    assert.strictEqual(
      record.transaction_hash,
      '0xabc123def456',
      'Should have transaction hash'
    );
    assert.strictEqual(
      record.wallet_address,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F',
      'Should have wallet address'
    );
    assert.deepStrictEqual(record.metadata, metadata, 'Should have metadata');
    assert.ok(record.polygonscan_url, 'Should have polygonscan URL');
    assert.ok(
      record.polygonscan_url.includes('0xabc123def456'),
      'Polygonscan URL should include tx hash'
    );
    assert.strictEqual(record.minting_status, 'confirmed', 'Should be confirmed');
    assert.ok(record.minted_at, 'Should have minted_at timestamp');
  });

  test('createCertificateRecord should generate Polygonscan URL', () => {
    const mintResult = {
      tokenId: '1',
      transactionHash: '0xtest123'
    };

    const record = createCertificateRecord({
      mintResult,
      metadata: {},
      userId: 'user',
      workId: 'work',
      walletAddress: '0xwallet'
    });

    assert.ok(
      record.polygonscan_url.startsWith('https://amoy.polygonscan.com'),
      'Should use Amoy Polygonscan'
    );
    assert.ok(
      record.polygonscan_url.includes('/tx/'),
      'Should be transaction URL'
    );
    assert.ok(
      record.polygonscan_url.includes('0xtest123'),
      'Should include tx hash'
    );
  });
});

// ============================================
// INTEGRATION TESTS (with real database)
// ============================================

describe('Blockchain API - Database Integration', { skip: !hasSupabaseConfig }, () => {
  let testUser;

  before(async () => {
    if (!hasSupabaseConfig) {
      console.log('\nSkipping database integration tests (no Supabase config)\n');
      return;
    }

    console.log('\nSetting up integration tests...');
    try {
      testUser = await createTestUser();
      console.log('Test user created successfully\n');
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  after(async () => {
    if (hasSupabaseConfig) {
      await cleanup();
    }
  });

  test('should create certificate record in database', async () => {
    const certificateData = {
      creative_work_id: crypto.randomUUID(),
      user_id: testUser.id,
      token_id: '999',
      transaction_hash: `0x${Date.now()}${Math.random().toString(36).substr(2)}`,
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F',
      metadata: createNFTMetadata({
        workTitle: 'Test Work',
        workDescription: 'Test Description',
        workHash: generateValidHash(),
        category: 'music',
        creatorName: 'Test Creator'
      }),
      polygonscan_url: 'https://amoy.polygonscan.com/tx/0xtest',
      minting_status: 'confirmed'
    };

    const { data, error } = await supabaseAdmin
      .from('copyright_certificates')
      .insert(certificateData)
      .select()
      .single();

    assert.ok(!error, `Should insert without error: ${error?.message || ''}`);
    assert.ok(data, 'Should return inserted data');
    assert.strictEqual(data.user_id, testUser.id, 'User ID should match');
    assert.strictEqual(data.token_id, '999', 'Token ID should match');
    assert.strictEqual(data.minting_status, 'confirmed', 'Status should be confirmed');

    // Track for cleanup
    testCertificates.push(data.id);
  });

  test('should enforce unique transaction hash constraint', async () => {
    const txHash = `0xunique${Date.now()}`;

    const cert1Data = {
      creative_work_id: crypto.randomUUID(),
      user_id: testUser.id,
      token_id: '1',
      transaction_hash: txHash,
      wallet_address: '0xtest1',
      metadata: { test: 'data' },
      polygonscan_url: 'https://test.com',
      minting_status: 'confirmed'
    };

    // First insert should succeed
    const { data: cert1, error: error1 } = await supabaseAdmin
      .from('copyright_certificates')
      .insert(cert1Data)
      .select()
      .single();

    assert.ok(!error1, 'First insert should succeed');
    testCertificates.push(cert1.id);

    // Second insert with same tx hash should fail
    const cert2Data = {
      ...cert1Data,
      creative_work_id: crypto.randomUUID(),
      token_id: '2'
    };

    const { error: error2 } = await supabaseAdmin
      .from('copyright_certificates')
      .insert(cert2Data)
      .select()
      .single();

    assert.ok(error2, 'Second insert should fail');
    assert.ok(
      error2.message.includes('duplicate') || error2.code === '23505',
      'Should be duplicate key error'
    );
  });

  test('should retrieve certificate by creative_work_id', async () => {
    const workId = crypto.randomUUID();

    const certData = {
      creative_work_id: workId,
      user_id: testUser.id,
      token_id: '111',
      transaction_hash: `0xretrieve${Date.now()}`,
      wallet_address: '0xtest',
      metadata: { name: 'Test Retrieve' },
      polygonscan_url: 'https://test.com',
      minting_status: 'confirmed'
    };

    const { data: inserted } = await supabaseAdmin
      .from('copyright_certificates')
      .insert(certData)
      .select()
      .single();

    testCertificates.push(inserted.id);

    // Retrieve by work_id
    const { data: retrieved, error } = await supabaseAdmin
      .from('copyright_certificates')
      .select('*')
      .eq('creative_work_id', workId)
      .single();

    assert.ok(!error, 'Should retrieve without error');
    assert.ok(retrieved, 'Should find certificate');
    assert.strictEqual(retrieved.creative_work_id, workId, 'Work ID should match');
    assert.strictEqual(retrieved.token_id, '111', 'Token ID should match');
  });

  test('should filter certificates by status', async () => {
    // Create certificates with different statuses
    const statuses = ['pending', 'confirmed', 'failed'];
    const insertedIds = [];
    const createdWorkIds = [];

    for (const status of statuses) {
      const workId = crypto.randomUUID();
      createdWorkIds.push(workId);

      const { data } = await supabaseAdmin
        .from('copyright_certificates')
        .insert({
          creative_work_id: workId,
          user_id: testUser.id,
          token_id: Math.random().toString(),
          transaction_hash: `0x${status}${Date.now()}${Math.random()}`,
          wallet_address: '0xtest',
          metadata: { status },
          polygonscan_url: 'https://test.com',
          minting_status: status
        })
        .select()
        .single();

      insertedIds.push(data.id);
    }

    testCertificates.push(...insertedIds);

    // Query for confirmed only
    const { data: confirmedCerts } = await supabaseAdmin
      .from('copyright_certificates')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('minting_status', 'confirmed')
      .in('creative_work_id', createdWorkIds);

    assert.ok(confirmedCerts.length >= 1, 'Should find confirmed certificate');
    assert.ok(
      confirmedCerts.every(c => c.minting_status === 'confirmed'),
      'All should be confirmed'
    );
  });

  test('should delete certificates when user is deleted (cascade)', async () => {
    // Create new test user
    const tempUser = await createTestUser();

    // Create certificate for temp user
    const { data: cert } = await supabaseAdmin
      .from('copyright_certificates')
      .insert({
        creative_work_id: crypto.randomUUID(),
        user_id: tempUser.id,
        token_id: '888',
        transaction_hash: `0xcascade${Date.now()}${Math.random()}`,
        wallet_address: '0xtest',
        metadata: { test: 'cascade' },
        polygonscan_url: 'https://test.com',
        minting_status: 'confirmed'
      })
      .select()
      .single();

    const certId = cert.id;

    // Delete user
    await deleteTestUser(tempUser.id);

    // Certificate should be deleted (cascaded)
    const { data: deletedCert } = await supabaseAdmin
      .from('copyright_certificates')
      .select('*')
      .eq('id', certId)
      .single();

    assert.ok(!deletedCert, 'Certificate should be deleted when user is deleted');
  });
});

// ============================================
// HASH GENERATION TESTS
// ============================================

describe('Blockchain API - Hash Generation', () => {
  test('generateValidHash should create 64-char hex string', () => {
    const hash = generateValidHash();

    assert.strictEqual(hash.length, 64, 'Should be 64 characters');
    assert.ok(/^[a-f0-9]{64}$/.test(hash), 'Should be hexadecimal');
  });

  test('generateValidHash should create unique hashes', () => {
    const hash1 = generateValidHash();
    const hash2 = generateValidHash();
    const hash3 = generateValidHash();

    assert.notEqual(hash1, hash2, 'Hashes should be unique');
    assert.notEqual(hash2, hash3, 'Hashes should be unique');
    assert.notEqual(hash1, hash3, 'Hashes should be unique');
  });

  test('generated hashes should pass validation', () => {
    for (let i = 0; i < 10; i++) {
      const hash = generateValidHash();
      assert.strictEqual(
        isValidSHA256(hash),
        true,
        `Generated hash ${i} should be valid`
      );
    }
  });
});

console.log('\n✅ All blockchain API tests completed\n');
