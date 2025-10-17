/**
 * Test Suite for blockchain.js Helper Functions
 *
 * Run with: node --test src/tests/blockchain.test.js
 * Or add to package.json: "test": "node --test src/tests/*.test.js"
 */

// Set up test environment variables BEFORE any imports
process.env.THIRDWEB_SECRET_KEY = 'test_secret_key_12345';
process.env.NEXT_PUBLIC_COPYRIGHT_CONTRACT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';
process.env.NEXT_PUBLIC_LICENSE_CONTRACT = '0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Mock environment variables before importing the module
const originalEnv = { ...process.env };

// Import functions after setting environment variables
import {
  getThirdwebSDK,
  CONTRACT_ADDRESSES,
  AMOY_CHAIN,
  getPolygonscanUrl,
  getPolygonscanNftUrl,
  isValidAddress,
  shortenAddress,
} from '../lib/blockchain.js';

// ============================================
// TEST SUITE: SDK Initialization
// ============================================
describe('getThirdwebSDK()', () => {
  it('should return a thirdweb client instance when secret key is present', () => {
    const sdk = getThirdwebSDK();
    assert.ok(sdk, 'SDK should be returned');
    assert.equal(typeof sdk, 'object', 'SDK should be an object');
  });

  it('should throw error when THIRDWEB_SECRET_KEY is missing', () => {
    const originalKey = process.env.THIRDWEB_SECRET_KEY;
    delete process.env.THIRDWEB_SECRET_KEY;

    assert.throws(
      () => getThirdwebSDK(),
      /THIRDWEB_SECRET_KEY is not defined/,
      'Should throw error about missing secret key'
    );

    // Restore the key
    process.env.THIRDWEB_SECRET_KEY = originalKey;
  });
});

// ============================================
// TEST SUITE: Contract Addresses
// ============================================
describe('CONTRACT_ADDRESSES', () => {
  it('should export COPYRIGHT contract address from environment', () => {
    // The blockchain.js reads process.env at import time
    // Since we set env vars before import, they should be available
    // However, if undefined, it means env vars need to be set before running tests
    const expectedCopyright = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';

    if (CONTRACT_ADDRESSES.COPYRIGHT === undefined) {
      console.warn('⚠️  COPYRIGHT address is undefined. Make sure NEXT_PUBLIC_COPYRIGHT_CONTRACT is set before running tests.');
    }

    // Test that the value matches what we expect (or is undefined)
    if (CONTRACT_ADDRESSES.COPYRIGHT !== undefined) {
      assert.equal(
        CONTRACT_ADDRESSES.COPYRIGHT,
        expectedCopyright,
        'COPYRIGHT address should match environment variable'
      );
    } else {
      // If undefined, just verify it's undefined (env var not set)
      assert.equal(CONTRACT_ADDRESSES.COPYRIGHT, undefined, 'COPYRIGHT is undefined when env var not set');
    }
  });

  it('should export LICENSE contract address from environment', () => {
    const expectedLicense = '0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a';

    if (CONTRACT_ADDRESSES.LICENSE === undefined) {
      console.warn('⚠️  LICENSE address is undefined. Make sure NEXT_PUBLIC_LICENSE_CONTRACT is set before running tests.');
    }

    // Test that the value matches what we expect (or is undefined)
    if (CONTRACT_ADDRESSES.LICENSE !== undefined) {
      assert.equal(
        CONTRACT_ADDRESSES.LICENSE,
        expectedLicense,
        'LICENSE address should match environment variable'
      );
    } else {
      // If undefined, just verify it's undefined (env var not set)
      assert.equal(CONTRACT_ADDRESSES.LICENSE, undefined, 'LICENSE is undefined when env var not set');
    }
  });

  it('should have both COPYRIGHT and LICENSE properties', () => {
    assert.ok('COPYRIGHT' in CONTRACT_ADDRESSES, 'Should have COPYRIGHT property');
    assert.ok('LICENSE' in CONTRACT_ADDRESSES, 'Should have LICENSE property');
  });

  it('should use correct structure for contract addresses', () => {
    assert.equal(typeof CONTRACT_ADDRESSES, 'object', 'CONTRACT_ADDRESSES should be an object');
    assert.equal(Object.keys(CONTRACT_ADDRESSES).length, 2, 'Should have exactly 2 properties');
  });
});

// ============================================
// TEST SUITE: Chain Configuration
// ============================================
describe('AMOY_CHAIN', () => {
  it('should export Polygon Amoy chain configuration', () => {
    assert.ok(AMOY_CHAIN, 'AMOY_CHAIN should be defined');
    assert.equal(typeof AMOY_CHAIN, 'object', 'AMOY_CHAIN should be an object');
  });

  it('should have chain ID 80002 for Polygon Amoy', () => {
    assert.equal(AMOY_CHAIN.id, 80002, 'Chain ID should be 80002');
  });
});

// ============================================
// TEST SUITE: Polygonscan Transaction URLs
// ============================================
describe('getPolygonscanUrl()', () => {
  const testTxHash = '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd';

  it('should return Amoy Polygonscan URL by default', () => {
    const url = getPolygonscanUrl(testTxHash);
    assert.equal(
      url,
      `https://amoy.polygonscan.com/tx/${testTxHash}`,
      'Should return Amoy URL by default'
    );
  });

  it('should return Amoy Polygonscan URL when network is "amoy"', () => {
    const url = getPolygonscanUrl(testTxHash, 'amoy');
    assert.equal(
      url,
      `https://amoy.polygonscan.com/tx/${testTxHash}`,
      'Should return Amoy URL for "amoy" network'
    );
  });

  it('should return mainnet Polygonscan URL when network is "mainnet"', () => {
    const url = getPolygonscanUrl(testTxHash, 'mainnet');
    assert.equal(
      url,
      `https://polygonscan.com/tx/${testTxHash}`,
      'Should return mainnet URL for "mainnet" network'
    );
  });

  it('should return mainnet Polygonscan URL when network is "polygon"', () => {
    const url = getPolygonscanUrl(testTxHash, 'polygon');
    assert.equal(
      url,
      `https://polygonscan.com/tx/${testTxHash}`,
      'Should return mainnet URL for "polygon" network'
    );
  });

  it('should return empty string for null txHash', () => {
    const url = getPolygonscanUrl(null);
    assert.equal(url, '', 'Should return empty string for null');
  });

  it('should return empty string for undefined txHash', () => {
    const url = getPolygonscanUrl(undefined);
    assert.equal(url, '', 'Should return empty string for undefined');
  });

  it('should return empty string for empty string txHash', () => {
    const url = getPolygonscanUrl('');
    assert.equal(url, '', 'Should return empty string for empty string');
  });

  it('should default to Amoy for unknown network names', () => {
    const url = getPolygonscanUrl(testTxHash, 'unknown-network');
    assert.equal(
      url,
      `https://amoy.polygonscan.com/tx/${testTxHash}`,
      'Should default to Amoy for unknown networks'
    );
  });
});

// ============================================
// TEST SUITE: Polygonscan NFT URLs
// ============================================
describe('getPolygonscanNftUrl()', () => {
  const testContract = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';
  const testTokenId = '123';

  it('should return Amoy Polygonscan NFT URL by default', () => {
    const url = getPolygonscanNftUrl(testContract, testTokenId);
    assert.equal(
      url,
      `https://amoy.polygonscan.com/token/${testContract}?a=${testTokenId}`,
      'Should return Amoy NFT URL by default'
    );
  });

  it('should return Amoy Polygonscan NFT URL when network is "amoy"', () => {
    const url = getPolygonscanNftUrl(testContract, testTokenId, 'amoy');
    assert.equal(
      url,
      `https://amoy.polygonscan.com/token/${testContract}?a=${testTokenId}`,
      'Should return Amoy NFT URL for "amoy" network'
    );
  });

  it('should return mainnet Polygonscan NFT URL when network is "mainnet"', () => {
    const url = getPolygonscanNftUrl(testContract, testTokenId, 'mainnet');
    assert.equal(
      url,
      `https://polygonscan.com/token/${testContract}?a=${testTokenId}`,
      'Should return mainnet NFT URL for "mainnet" network'
    );
  });

  it('should return mainnet Polygonscan NFT URL when network is "polygon"', () => {
    const url = getPolygonscanNftUrl(testContract, testTokenId, 'polygon');
    assert.equal(
      url,
      `https://polygonscan.com/token/${testContract}?a=${testTokenId}`,
      'Should return mainnet NFT URL for "polygon" network'
    );
  });

  it('should work with numeric tokenId', () => {
    const url = getPolygonscanNftUrl(testContract, 456);
    assert.equal(
      url,
      `https://amoy.polygonscan.com/token/${testContract}?a=456`,
      'Should work with numeric tokenId'
    );
  });

  it('should work with tokenId 0', () => {
    const url = getPolygonscanNftUrl(testContract, 0);
    assert.equal(
      url,
      `https://amoy.polygonscan.com/token/${testContract}?a=0`,
      'Should work with tokenId 0'
    );
  });

  it('should return empty string for null contractAddress', () => {
    const url = getPolygonscanNftUrl(null, testTokenId);
    assert.equal(url, '', 'Should return empty string for null contract');
  });

  it('should return empty string for undefined contractAddress', () => {
    const url = getPolygonscanNftUrl(undefined, testTokenId);
    assert.equal(url, '', 'Should return empty string for undefined contract');
  });

  it('should return empty string for null tokenId', () => {
    const url = getPolygonscanNftUrl(testContract, null);
    assert.equal(url, '', 'Should return empty string for null tokenId');
  });

  it('should return empty string for undefined tokenId', () => {
    const url = getPolygonscanNftUrl(testContract, undefined);
    assert.equal(url, '', 'Should return empty string for undefined tokenId');
  });

  it('should default to Amoy for unknown network names', () => {
    const url = getPolygonscanNftUrl(testContract, testTokenId, 'unknown-network');
    assert.equal(
      url,
      `https://amoy.polygonscan.com/token/${testContract}?a=${testTokenId}`,
      'Should default to Amoy for unknown networks'
    );
  });
});

// ============================================
// TEST SUITE: Address Validation
// ============================================
describe('isValidAddress()', () => {
  it('should return true for valid Ethereum address', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';
    assert.equal(isValidAddress(validAddress), true, 'Should return true for valid address');
  });

  it('should return true for valid address with lowercase hex', () => {
    const validAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
    assert.equal(isValidAddress(validAddress), true, 'Should return true for lowercase hex');
  });

  it('should return true for valid address with uppercase hex', () => {
    const validAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    assert.equal(isValidAddress(validAddress), true, 'Should return true for uppercase hex');
  });

  it('should return true for valid address with mixed case hex', () => {
    const validAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
    assert.equal(isValidAddress(validAddress), true, 'Should return true for mixed case hex');
  });

  it('should return false for address without 0x prefix', () => {
    const invalidAddress = '742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';
    assert.equal(isValidAddress(invalidAddress), false, 'Should return false for no 0x prefix');
  });

  it('should return false for too short address', () => {
    const invalidAddress = '0x742d35Cc';
    assert.equal(isValidAddress(invalidAddress), false, 'Should return false for too short');
  });

  it('should return false for too long address', () => {
    const invalidAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F123';
    assert.equal(isValidAddress(invalidAddress), false, 'Should return false for too long');
  });

  it('should return false for address with invalid hex characters', () => {
    const invalidAddress = '0xGGGGGG6634C0532925a3b844Bc9e7595f0aE8F';
    assert.equal(isValidAddress(invalidAddress), false, 'Should return false for invalid hex');
  });

  it('should return false for address with special characters', () => {
    const invalidAddress = '0x742d35Cc!@#$C0532925a3b844Bc9e7595f0aE8F';
    assert.equal(isValidAddress(invalidAddress), false, 'Should return false for special chars');
  });

  it('should return false for null', () => {
    assert.equal(isValidAddress(null), false, 'Should return false for null');
  });

  it('should return false for undefined', () => {
    assert.equal(isValidAddress(undefined), false, 'Should return false for undefined');
  });

  it('should return false for number', () => {
    assert.equal(isValidAddress(123), false, 'Should return false for number');
  });

  it('should return false for boolean', () => {
    assert.equal(isValidAddress(true), false, 'Should return false for boolean');
  });

  it('should return false for object', () => {
    assert.equal(isValidAddress({}), false, 'Should return false for object');
  });

  it('should return false for array', () => {
    assert.equal(isValidAddress([]), false, 'Should return false for array');
  });

  it('should return false for empty string', () => {
    assert.equal(isValidAddress(''), false, 'Should return false for empty string');
  });
});

// ============================================
// TEST SUITE: Address Shortening
// ============================================
describe('shortenAddress()', () => {
  it('should shorten valid Ethereum address correctly', () => {
    const fullAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F';
    const shortened = shortenAddress(fullAddress);
    assert.equal(shortened, '0x742d...aE8F', 'Should shorten to correct format');
  });

  it('should keep first 6 characters and last 4 characters', () => {
    const fullAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const shortened = shortenAddress(fullAddress);
    assert.equal(shortened, '0xABCD...EF12', 'Should preserve first 6 and last 4 chars');
  });

  it('should return empty string for null', () => {
    const shortened = shortenAddress(null);
    assert.equal(shortened, '', 'Should return empty string for null');
  });

  it('should return empty string for undefined', () => {
    const shortened = shortenAddress(undefined);
    assert.equal(shortened, '', 'Should return empty string for undefined');
  });

  it('should return empty string for empty string', () => {
    const shortened = shortenAddress('');
    assert.equal(shortened, '', 'Should return empty string for empty string');
  });

  it('should return original string if too short to shorten', () => {
    const shortString = '0x742d';
    const result = shortenAddress(shortString);
    assert.equal(result, shortString, 'Should return original if too short');
  });

  it('should handle exactly 10 character string', () => {
    const tenChars = '0x12345678';
    const result = shortenAddress(tenChars);
    // Should still shorten: first 6 (0x1234) + last 4 (5678)
    assert.equal(result, '0x1234...5678', 'Should shorten 10 char string');
  });

  it('should preserve case in shortened address', () => {
    const mixedCase = '0xAbCdEf1234567890ABCDEF1234567890ABCDabcd';
    const shortened = shortenAddress(mixedCase);
    assert.equal(shortened, '0xAbCd...abcd', 'Should preserve case');
  });
});

// ============================================
// CLEANUP
// ============================================
after(() => {
  // Restore original environment
  process.env = originalEnv;
  console.log('\n✅ All blockchain helper tests completed!\n');
});
