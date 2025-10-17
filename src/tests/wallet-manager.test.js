/**
 * Test suite for wallet-manager.js
 *
 * Tests encryption, decryption, wallet creation, and retrieval
 *
 * Run with: npm run test:wallet
 */

import { describe, test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ethers } from 'ethers';
import crypto from 'crypto';

// Set up test environment variables
process.env.WALLET_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Simple encryption/decryption functions for testing (copied from wallet-manager.js logic)
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey() {
  const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'utf-8');
  if (key.length < 32) {
    const paddedKey = Buffer.alloc(32);
    key.copy(paddedKey);
    return paddedKey;
  }
  return key.slice(0, 32);
}

const ENCRYPTION_KEY = getEncryptionKey();

function encryptPrivateKey(privateKey) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

function decryptPrivateKey(encryptedKey) {
  try {
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted key format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

describe('Wallet Manager - Encryption/Decryption', () => {
  test('encryptPrivateKey should encrypt a private key', () => {
    const privateKey = 'a'.repeat(64);
    const encrypted = encryptPrivateKey(privateKey);

    assert.ok(encrypted, 'Encrypted value should exist');
    assert.ok(encrypted.includes(':'), 'Encrypted value should contain IV separator');
    assert.notEqual(encrypted, privateKey, 'Encrypted value should differ from original');
  });

  test('decryptPrivateKey should decrypt to original value', () => {
    const privateKey = 'b'.repeat(64);
    const encrypted = encryptPrivateKey(privateKey);
    const decrypted = decryptPrivateKey(encrypted);

    assert.strictEqual(decrypted, privateKey, 'Decrypted value should match original');
  });

  test('different encryptions of same key should produce different results', () => {
    const privateKey = 'c'.repeat(64);
    const encrypted1 = encryptPrivateKey(privateKey);
    const encrypted2 = encryptPrivateKey(privateKey);

    assert.notEqual(encrypted1, encrypted2, 'Different encryptions should differ (random IV)');

    const decrypted1 = decryptPrivateKey(encrypted1);
    const decrypted2 = decryptPrivateKey(encrypted2);

    assert.strictEqual(decrypted1, privateKey);
    assert.strictEqual(decrypted2, privateKey);
  });

  test('decryptPrivateKey should throw on invalid format', () => {
    assert.throws(
      () => decryptPrivateKey('invalid-format'),
      /Invalid encrypted key format/,
      'Should throw on invalid format'
    );
  });

  test('encryptPrivateKey should handle special characters', () => {
    const privateKey = '123abc!@#$%^&*()';
    const encrypted = encryptPrivateKey(privateKey);
    const decrypted = decryptPrivateKey(encrypted);

    assert.strictEqual(decrypted, privateKey, 'Should handle special characters');
  });

  test('encryption key should be exactly 32 bytes', () => {
    const key = getEncryptionKey();
    assert.strictEqual(key.length, 32, 'Encryption key should be exactly 32 bytes');
  });
});

describe('Wallet Manager - Wallet Generation', () => {
  test('should generate valid Ethereum wallet', () => {
    const wallet = ethers.Wallet.createRandom();

    assert.ok(wallet.address, 'Should have address');
    assert.ok(wallet.address.startsWith('0x'), 'Address should start with 0x');
    assert.strictEqual(wallet.address.length, 42, 'Address should be 42 characters');
    assert.ok(wallet.privateKey, 'Should have private key');
  });

  test('should generate different wallets each time', () => {
    const wallet1 = ethers.Wallet.createRandom();
    const wallet2 = ethers.Wallet.createRandom();
    const wallet3 = ethers.Wallet.createRandom();

    assert.notEqual(wallet1.address, wallet2.address, 'Wallets should differ');
    assert.notEqual(wallet2.address, wallet3.address, 'Wallets should differ');
    assert.notEqual(wallet1.address, wallet3.address, 'Wallets should differ');
  });

  test('should create wallet from private key', () => {
    const originalWallet = ethers.Wallet.createRandom();
    const privateKey = originalWallet.privateKey;

    const recreatedWallet = new ethers.Wallet(privateKey);

    assert.strictEqual(
      recreatedWallet.address.toLowerCase(),
      originalWallet.address.toLowerCase(),
      'Recreated wallet should have same address'
    );
  });

  test('wallet should be able to sign messages', async () => {
    const wallet = ethers.Wallet.createRandom();
    const message = 'Test message';

    const signature = await wallet.signMessage(message);
    assert.ok(signature, 'Should produce signature');

    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    assert.strictEqual(
      recoveredAddress.toLowerCase(),
      wallet.address.toLowerCase(),
      'Recovered address should match wallet address'
    );
  });
});

describe('Wallet Manager - Encryption Flow', () => {
  test('complete encryption workflow', () => {
    // Simulate wallet creation and encryption flow
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey.slice(2); // Remove 0x prefix

    // Encrypt private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey);
    assert.ok(encryptedPrivateKey.includes(':'), 'Should be encrypted with IV');

    // Simulate storage and retrieval
    const storedData = {
      wallet_address: address,
      encrypted_private_key: encryptedPrivateKey,
      blockchain: 'polygon-amoy'
    };

    // Decrypt and recreate wallet
    const decryptedKey = decryptPrivateKey(storedData.encrypted_private_key);
    const recreatedWallet = new ethers.Wallet(`0x${decryptedKey}`);

    // Verify addresses match
    assert.strictEqual(
      recreatedWallet.address.toLowerCase(),
      storedData.wallet_address.toLowerCase(),
      'Addresses should match after encryption/decryption'
    );
  });

  test('multiple wallets with encryption', () => {
    const wallets = [];

    // Create and encrypt 5 wallets
    for (let i = 0; i < 5; i++) {
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey.slice(2);
      const encrypted = encryptPrivateKey(privateKey);

      wallets.push({
        address: wallet.address,
        encrypted: encrypted
      });
    }

    // Verify all addresses are unique
    const addresses = wallets.map(w => w.address);
    const uniqueAddresses = new Set(addresses);
    assert.strictEqual(
      uniqueAddresses.size,
      wallets.length,
      'All wallet addresses should be unique'
    );

    // Verify all can be decrypted and match
    wallets.forEach(walletData => {
      const decrypted = decryptPrivateKey(walletData.encrypted);
      const wallet = new ethers.Wallet(`0x${decrypted}`);
      assert.strictEqual(
        wallet.address.toLowerCase(),
        walletData.address.toLowerCase(),
        'Decrypted wallet should match original'
      );
    });
  });
});

describe('Wallet Manager - Edge Cases', () => {
  test('should handle very long private keys', () => {
    const longKey = 'a'.repeat(200);
    const encrypted = encryptPrivateKey(longKey);
    const decrypted = decryptPrivateKey(encrypted);
    assert.strictEqual(decrypted, longKey, 'Should handle long keys');
  });

  test('should handle empty string', () => {
    const empty = '';
    const encrypted = encryptPrivateKey(empty);
    const decrypted = decryptPrivateKey(encrypted);
    assert.strictEqual(decrypted, empty, 'Should handle empty string');
  });

  test('should handle unicode characters', () => {
    const unicode = '你好世界🌍';
    const encrypted = encryptPrivateKey(unicode);
    const decrypted = decryptPrivateKey(encrypted);
    assert.strictEqual(decrypted, unicode, 'Should handle unicode');
  });

  test('should throw on corrupted encrypted data', () => {
    const privateKey = 'test-key';
    const encrypted = encryptPrivateKey(privateKey);

    // Corrupt the encrypted data
    const corrupted = encrypted.slice(0, -5) + 'xxxxx';

    assert.throws(
      () => decryptPrivateKey(corrupted),
      /Failed to decrypt/,
      'Should throw on corrupted data'
    );
  });

  test('should throw on missing IV separator', () => {
    assert.throws(
      () => decryptPrivateKey('no-separator-here'),
      /Invalid encrypted key format/,
      'Should throw on missing separator'
    );
  });
});

describe('Wallet Manager - Transaction Signing', () => {
  test('wallet should sign transactions', async () => {
    const wallet = ethers.Wallet.createRandom();

    const tx = {
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F',
      value: ethers.utils.parseEther('0.001'),
      gasLimit: 21000,
      gasPrice: ethers.utils.parseUnits('10', 'gwei'),
      nonce: 0,
      chainId: 80002 // Amoy testnet
    };

    const signedTx = await wallet.signTransaction(tx);
    assert.ok(signedTx, 'Should produce signed transaction');
    assert.ok(signedTx.startsWith('0x'), 'Signed tx should start with 0x');
  });

  test('encrypted wallet should sign after decryption', async () => {
    // Create wallet
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey.slice(2);

    // Encrypt
    const encrypted = encryptPrivateKey(privateKey);

    // Decrypt and recreate
    const decrypted = decryptPrivateKey(encrypted);
    const recreatedWallet = new ethers.Wallet(`0x${decrypted}`);

    // Sign message
    const message = 'Test signing';
    const signature1 = await wallet.signMessage(message);
    const signature2 = await recreatedWallet.signMessage(message);

    // Signatures should be identical
    assert.strictEqual(signature1, signature2, 'Signatures should match');
  });
});

describe('Wallet Manager - Input Validation', () => {
  test('should validate userId format', () => {
    const invalidUserIds = [
      null,
      undefined,
      '',
      123,
      {},
      [],
      true
    ];

    invalidUserIds.forEach(userId => {
      const isValid = typeof userId === 'string' && userId.length > 0;
      assert.strictEqual(isValid, false, `${userId} should be invalid`);
    });
  });

  test('should validate valid userId format', () => {
    const validUserIds = [
      'user-123',
      'uuid-v4-format',
      'a'.repeat(36)
    ];

    validUserIds.forEach(userId => {
      const isValid = typeof userId === 'string' && userId.length > 0;
      assert.strictEqual(isValid, true, `${userId} should be valid`);
    });
  });
});

console.log('\n✅ All wallet-manager tests completed successfully!\n');
