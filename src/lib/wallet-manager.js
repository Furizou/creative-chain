/**
 * Custodial Wallet Manager
 *
 * Handles creation, encryption, and retrieval of user custodial wallets.
 * Private keys are encrypted using AES-256-CBC before storage.
 *
 * Security Note: Never expose private keys or this module to frontend code.
 * This module should only be used in server-side API routes.
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Environment validation with development fallbacks
const WALLET_ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'dev_key_32_chars_for_testing_only!';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Warning for development
if (!process.env.WALLET_ENCRYPTION_KEY) {
  console.warn('⚠️  WALLET_ENCRYPTION_KEY not set - using development key. DO NOT USE IN PRODUCTION!');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  Supabase environment variables not configured. Wallet features will be disabled.');
}

// Initialize Supabase client with service role key for admin operations
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
// Ensure key is exactly 32 bytes for AES-256
const ENCRYPTION_KEY = (() => {
  const key = Buffer.from(WALLET_ENCRYPTION_KEY, 'utf-8');
  if (key.length < 32) {
    // Pad with zeros if too short
    const paddedKey = Buffer.alloc(32);
    key.copy(paddedKey);
    return paddedKey;
  }
  // Truncate if too long
  return key.slice(0, 32);
})();
const IV_LENGTH = 16;

/**
 * Encrypts a private key for secure storage
 *
 * @param {string} privateKey - The private key to encrypt (without 0x prefix)
 * @returns {string} Encrypted string in format: iv:encryptedData
 * @throws {Error} If encryption fails
 */
export function encryptPrivateKey(privateKey) {
  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data together
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

/**
 * Decrypts an encrypted private key
 *
 * @param {string} encryptedKey - Encrypted string in format: iv:encryptedData
 * @returns {string} Decrypted private key
 * @throws {Error} If decryption fails or format is invalid
 */
export function decryptPrivateKey(encryptedKey) {
  try {
    // Split IV and encrypted data
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted key format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

/**
 * Creates a new custodial wallet for a user
 *
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {string} blockchain - Blockchain network (default: 'polygon-amoy')
 * @returns {Promise<{address: string, wallet: ethers.Wallet}>} Wallet address and wallet object
 * @throws {Error} If wallet creation or database insert fails
 */
export async function createCustodialWallet(userId, blockchain = 'polygon-amoy') {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      console.warn('⚠️  Supabase not configured - creating mock wallet for development');
      // Return a mock wallet for development
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        wallet: wallet,
        mock: true // Flag to indicate this is a mock wallet
      };
    }

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required');
    }

    // Check if user already has a wallet
    const { data: existingWallet, error: checkError } = await supabaseAdmin
      .from('custodial_wallets')
      .select('wallet_address')
      .eq('user_id', userId)
      .single();

    if (existingWallet) {
      throw new Error('User already has a custodial wallet');
    }

    // Ignore error if no wallet found (expected case)
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Generate new random wallet
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey.slice(2); // Remove 0x prefix for encryption

    // Encrypt the private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey);

    // Insert wallet record into database
    const { data, error } = await supabaseAdmin
      .from('custodial_wallets')
      .insert({
        user_id: userId,
        wallet_address: address,
        encrypted_private_key: encryptedPrivateKey,
        blockchain: blockchain
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Created custodial wallet for user ${userId}: ${address}`);

    return {
      address,
      wallet
    };
  } catch (error) {
    throw new Error(`Failed to create custodial wallet: ${error.message}`);
  }
}

/**
 * Retrieves and decrypts a user's custodial wallet
 *
 * @param {string} userId - The user's UUID from Supabase auth
 * @returns {Promise<ethers.Wallet|null>} Wallet object ready to sign transactions, or null if not found
 * @throws {Error} If database query or decryption fails
 */
export async function getUserCustodialWallet(userId) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required');
    }

    // Query database for user's wallet
    const { data, error } = await supabaseAdmin
      .from('custodial_wallets')
      .select('wallet_address, encrypted_private_key, blockchain')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No wallet found
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Decrypt the private key
    const privateKey = decryptPrivateKey(data.encrypted_private_key);

    // Create wallet instance from private key (add 0x prefix back)
    const wallet = new ethers.Wallet(`0x${privateKey}`);

    // Verify wallet address matches stored address
    if (wallet.address.toLowerCase() !== data.wallet_address.toLowerCase()) {
      throw new Error('Wallet address mismatch - possible data corruption');
    }

    // Clear sensitive data from memory
    // Note: JavaScript doesn't have true memory clearing, but we can help GC
    data.encrypted_private_key = null;

    return wallet;
  } catch (error) {
    throw new Error(`Failed to retrieve custodial wallet: ${error.message}`);
  }
}

/**
 * Gets a user's wallet address without decrypting the private key
 * Useful for display purposes or checking if wallet exists
 *
 * @param {string} userId - The user's UUID from Supabase auth
 * @returns {Promise<{address: string, blockchain: string}|null>} Wallet info or null if not found
 * @throws {Error} If database query fails
 */
export async function getUserWalletAddress(userId) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required');
    }

    // Query database for user's wallet address only
    const { data, error } = await supabaseAdmin
      .from('custodial_wallets')
      .select('wallet_address, blockchain')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No wallet found
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      address: data.wallet_address,
      blockchain: data.blockchain
    };
  } catch (error) {
    throw new Error(`Failed to get wallet address: ${error.message}`);
  }
}

/**
 * Checks if a user has a custodial wallet
 *
 * @param {string} userId - The user's UUID from Supabase auth
 * @returns {Promise<boolean>} True if wallet exists, false otherwise
 */
export async function hasUserWallet(userId) {
  try {
    const walletInfo = await getUserWalletAddress(userId);
    return walletInfo !== null;
  } catch (error) {
    throw new Error(`Failed to check wallet existence: ${error.message}`);
  }
}

/**
 * Deletes a user's custodial wallet (use with caution!)
 * This is irreversible and will result in loss of funds if wallet has balance
 *
 * @param {string} userId - The user's UUID from Supabase auth
 * @returns {Promise<boolean>} True if wallet was deleted, false if not found
 * @throws {Error} If database operation fails
 * @warning This will permanently delete the wallet and any funds will be lost
 */
export async function deleteCustodialWallet(userId) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required');
    }

    // Delete wallet record
    const { data, error } = await supabaseAdmin
      .from('custodial_wallets')
      .delete()
      .eq('user_id', userId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return false;
    }

    console.warn(`Deleted custodial wallet for user ${userId}`);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete custodial wallet: ${error.message}`);
  }
}