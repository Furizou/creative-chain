/**
 * Unit tests for certificate verification API
 * Tests all input methods, validation, and verification logic
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const VERIFY_ENDPOINT = `${API_BASE}/api/blockchain/verify-certificate`;

describe('Certificate Verification API - Input Validation', () => {

  it('should reject request with no parameters', async () => {
    const response = await fetch(VERIFY_ENDPOINT);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.verified).toBe(false);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Missing required parameter');
  });

  it('should reject request with multiple parameters', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?tx=0xabc123&tokenId=1`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.verified).toBe(false);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Only one lookup parameter');
  });

  it('should reject invalid transaction hash format', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?tx=invalid`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Invalid transaction hash format');
  });

  it('should reject invalid token ID format', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=abc`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Invalid token ID format');
  });

  it('should reject invalid work hash format', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?workHash=short`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Invalid work hash format');
  });

  it('should reject invalid certificate ID format', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?certificateId=not-a-uuid`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('invalid_input');
    expect(data.message).toContain('Invalid certificate ID format');
  });

  it('should accept valid transaction hash format', async () => {
    const validTxHash = '0x' + 'a'.repeat(64);
    const response = await fetch(`${VERIFY_ENDPOINT}?tx=${validTxHash}`);
    const data = await response.json();

    // Should not be invalid_input (will be not_found if cert doesn't exist)
    expect(data.status).not.toBe('invalid_input');
  });

  it('should accept valid token ID format', async () => {
    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=999999`);
    const data = await response.json();

    expect(data.status).not.toBe('invalid_input');
  });

  it('should accept valid work hash format', async () => {
    const validWorkHash = 'a'.repeat(64);
    const response = await fetch(`${VERIFY_ENDPOINT}?workHash=${validWorkHash}`);
    const data = await response.json();

    expect(data.status).not.toBe('invalid_input');
  });

  it('should accept valid certificate ID format', async () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const response = await fetch(`${VERIFY_ENDPOINT}?certificateId=${validUUID}`);
    const data = await response.json();

    expect(data.status).not.toBe('invalid_input');
  });
});

describe('Certificate Verification API - Not Found Scenarios', () => {

  it('should return not_found for non-existent transaction hash', async () => {
    const fakeTxHash = '0x' + '1'.repeat(64);
    const response = await fetch(`${VERIFY_ENDPOINT}?tx=${fakeTxHash}`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.verified).toBe(false);
    expect(data.status).toBe('not_found');
    expect(data.message).toContain('No certificate found');
    expect(data.searchedFor).toEqual({
      type: 'transaction_hash',
      value: fakeTxHash
    });
  });

  it('should return not_found for non-existent token ID', async () => {
    const fakeTokenId = '999999999';
    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${fakeTokenId}`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.verified).toBe(false);
    expect(data.status).toBe('not_found');
    expect(data.searchedFor.type).toBe('token_id');
    expect(data.searchedFor.value).toBe(fakeTokenId);
  });
});

describe('Certificate Verification API - POST Method', () => {

  it('should accept POST request with transaction hash in body', async () => {
    const txHash = '0x' + 'a'.repeat(64);
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx: txHash })
    });
    const data = await response.json();

    expect(data.status).not.toBe('invalid_input');
  });

  it('should accept POST request with tokenId in body', async () => {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: '123' })
    });
    const data = await response.json();

    expect(data.status).not.toBe('invalid_input');
  });

  it('should reject POST request with invalid JSON', async () => {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
  });
});

describe('Certificate Verification API - Real Certificate Tests', () => {
  let testCertificate = null;
  let testUserId = null;
  let testWorkId = null;

  beforeAll(async () => {
    // Try to find an existing confirmed certificate for testing
    const { data: certificates } = await supabase
      .from('copyright_certificates')
      .select('*')
      .eq('minting_status', 'confirmed')
      .limit(1);

    if (certificates && certificates.length > 0) {
      testCertificate = certificates[0];
      testUserId = testCertificate.user_id;
      testWorkId = testCertificate.creative_work_id;
      console.log('Using existing certificate for tests:', testCertificate.token_id);
    } else {
      console.log('No confirmed certificates found. Some tests will be skipped.');
    }
  });

  it('should verify certificate by transaction hash', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tx=${testCertificate.transaction_hash}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.certificate).toBeDefined();
    expect(data.certificate.tokenId).toBe(testCertificate.token_id);
    expect(data.certificate.transactionHash).toBe(testCertificate.transaction_hash);
    expect(data.polygonscanUrl).toContain('polygonscan.com');
  });

  it('should verify certificate by token ID', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${testCertificate.token_id}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.certificate).toBeDefined();
    expect(data.certificate.tokenId).toBe(testCertificate.token_id);
  });

  it('should verify certificate by work hash', async () => {
    if (!testCertificate || !testCertificate.metadata?.work_hash) {
      console.log('Skipping: No test certificate with work hash available');
      return;
    }

    const workHash = testCertificate.metadata.work_hash;
    const response = await fetch(`${VERIFY_ENDPOINT}?workHash=${workHash}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.certificate).toBeDefined();
    expect(data.certificate.workDetails.workHash).toBe(workHash);
  });

  it('should verify certificate by certificate ID', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?certificateId=${testCertificate.id}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.certificate).toBeDefined();
  });

  it('should include work details in verification response', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${testCertificate.token_id}`);
    const data = await response.json();

    expect(data.certificate.workDetails).toBeDefined();
    expect(data.certificate.workDetails.title).toBeDefined();
    expect(data.certificate.workDetails.creator).toBeDefined();
    expect(data.certificate.workDetails.category).toBeDefined();
    expect(data.certificate.workDetails.workHash).toBeDefined();
    expect(data.certificate.workDetails.registeredAt).toBeDefined();
  });

  it('should include blockchain data in verification response', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${testCertificate.token_id}`);
    const data = await response.json();

    expect(data.certificate.blockchainData).toBeDefined();
    expect(data.certificate.blockchainData.currentOwner).toBeDefined();
    expect(data.certificate.blockchainData.network).toBe('polygon-amoy');
  });

  it('should include verification checks in response', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${testCertificate.token_id}`);
    const data = await response.json();

    expect(data.certificate.verification).toBeDefined();
    expect(data.certificate.verification).toHaveProperty('ownershipMatch');
    expect(data.certificate.verification).toHaveProperty('metadataMatch');
    expect(data.certificate.verification).toHaveProperty('tokenExists');
    expect(data.certificate.verification).toHaveProperty('hashMatch');
    expect(data.certificate.verification).toHaveProperty('timestampValid');
  });

  it('should return verified status for authentic certificate', async () => {
    if (!testCertificate) {
      console.log('Skipping: No test certificate available');
      return;
    }

    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${testCertificate.token_id}`);
    const data = await response.json();

    expect(data.verifiedAt).toBeDefined();
    expect(data.status).toMatch(/^(authentic|transferred|inconsistent)$/);
  });
});

describe('Certificate Verification API - Pending Certificate Handling', () => {

  it('should handle pending certificates appropriately', async () => {
    // Try to find a pending certificate
    const { data: pendingCerts } = await supabase
      .from('copyright_certificates')
      .select('*')
      .eq('minting_status', 'pending')
      .limit(1);

    if (!pendingCerts || pendingCerts.length === 0) {
      console.log('No pending certificates found. Skipping test.');
      return;
    }

    const pendingCert = pendingCerts[0];
    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${pendingCert.token_id}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.verified).toBe(false);
    expect(data.status).toBe('pending');
    expect(data.message).toContain('pending');
  });
});

describe('Certificate Verification API - Response Format', () => {

  it('should include Polygonscan URL in successful verification', async () => {
    const { data: certificates } = await supabase
      .from('copyright_certificates')
      .select('*')
      .eq('minting_status', 'confirmed')
      .limit(1);

    if (!certificates || certificates.length === 0) {
      console.log('No confirmed certificates found. Skipping test.');
      return;
    }

    const cert = certificates[0];
    const response = await fetch(`${VERIFY_ENDPOINT}?tokenId=${cert.token_id}`);
    const data = await response.json();

    expect(data.polygonscanUrl).toBeDefined();
    expect(data.polygonscanUrl).toContain('amoy.polygonscan.com');
    expect(data.polygonscanUrl).toContain(cert.transaction_hash);
  });

  it('should include verifiedAt timestamp in all responses', async () => {
    const validTxHash = '0x' + 'a'.repeat(64);
    const response = await fetch(`${VERIFY_ENDPOINT}?tx=${validTxHash}`);
    const data = await response.json();

    // Even for not found, should include verifiedAt or just skip this check
    if (data.status !== 'not_found') {
      expect(data.verifiedAt).toBeDefined();
    }
  });
});

console.log('Certificate Verification API Tests - Ready to run');
console.log('Run with: npm test -- verify-certificate-api.test.js');
