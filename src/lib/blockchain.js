// ============================================
// IMPORTS
// ============================================
import { createThirdwebClient } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";

// ============================================
// 1. SDK INITIALIZATION
// ============================================
/**
 * Initialize thirdweb client for backend operations
 * @returns {Object} Configured thirdweb client instance
 * @throws {Error} If THIRDWEB_SECRET_KEY is missing
 */
export function getThirdwebSDK() {
  if (!process.env.THIRDWEB_SECRET_KEY) {
    throw new Error(
      "THIRDWEB_SECRET_KEY is not defined in environment variables"
    );
  }

  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY,
  });

  return client;
}

// ============================================
// 2. CONTRACT ADDRESSES
// ============================================
/**
 * Get contract addresses (dynamic to support env loading)
 * @returns {Object} Contract addresses
 */
export function getContractAddresses() {
  return {
    COPYRIGHT: process.env.NEXT_PUBLIC_COPYRIGHT_CONTRACT || process.env.NEXT_PUBLIC_COPYRIGHT_NFT_CONTRACT,
    LICENSE: process.env.NEXT_PUBLIC_LICENSE_CONTRACT || process.env.NEXT_PUBLIC_LICENSE_NFT_CONTRACT,
  };
}

/**
 * Smart contract addresses on Polygon Amoy
 * @deprecated Use getContractAddresses() for dynamic loading
 */
export const CONTRACT_ADDRESSES = getContractAddresses();

// ============================================
// 3. CHAIN CONFIGURATION
// ============================================
/**
 * Polygon Amoy testnet chain configuration
 */
export const AMOY_CHAIN = polygonAmoy;

// ============================================
// 4. POLYGONSCAN TRANSACTION URL
// ============================================
/**
 * Get Polygonscan URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {string} [network="amoy"] - Network name ("amoy", "mainnet", or "polygon")
 * @returns {string} Full Polygonscan URL
 */
export function getPolygonscanUrl(txHash, network = "amoy") {
  if (!txHash) {
    return "";
  }

  let baseUrl;
  if (network === "amoy") {
    baseUrl = "https://amoy.polygonscan.com";
  } else if (network === "mainnet" || network === "polygon") {
    baseUrl = "https://polygonscan.com";
  } else {
    // Default to amoy if unknown network
    baseUrl = "https://amoy.polygonscan.com";
  }

  return `${baseUrl}/tx/${txHash}`;
}

// ============================================
// 5. POLYGONSCAN NFT URL
// ============================================
/**
 * Get Polygonscan URL for an NFT token
 * @param {string} contractAddress - Contract address
 * @param {string|number} tokenId - Token ID
 * @param {string} [network="amoy"] - Network name ("amoy", "mainnet", or "polygon")
 * @returns {string} Full Polygonscan NFT URL
 */
export function getPolygonscanNftUrl(contractAddress, tokenId, network = "amoy") {
  if (!contractAddress || tokenId === null || tokenId === undefined) {
    return "";
  }

  let baseUrl;
  if (network === "amoy") {
    baseUrl = "https://amoy.polygonscan.com";
  } else if (network === "mainnet" || network === "polygon") {
    baseUrl = "https://polygonscan.com";
  } else {
    // Default to amoy if unknown network
    baseUrl = "https://amoy.polygonscan.com";
  }

  return `${baseUrl}/token/${contractAddress}?a=${tokenId}`;
}

// ============================================
// 6. ADDRESS VALIDATION
// ============================================
/**
 * Validate Ethereum address format
 * @param {any} address - Address to validate
 * @returns {boolean} True if valid Ethereum address
 */
export function isValidAddress(address) {
  // Check if address is a string
  if (typeof address !== "string") {
    return false;
  }

  // Check if address starts with 0x
  if (!address.startsWith("0x")) {
    return false;
  }

  // Check if address is exactly 42 characters (0x + 40 hex chars)
  if (address.length !== 42) {
    return false;
  }

  // Check if characters after 0x are valid hexadecimal
  const hexPart = address.slice(2);
  const hexRegex = /^[0-9a-fA-F]+$/;

  return hexRegex.test(hexPart);
}

// ============================================
// 7. ADDRESS SHORTENING
// ============================================
/**
 * Shorten address for display (0x742d...9e8F)
 * @param {string} address - Full address
 * @returns {string} Shortened address
 */
export function shortenAddress(address) {
  // Handle null/undefined
  if (!address) {
    return "";
  }

  // If address is too short to shorten, return as-is
  if (address.length < 10) {
    return address;
  }

  // Extract first 6 characters (including 0x) and last 4 characters
  const start = address.slice(0, 6);
  const end = address.slice(-4);

  return `${start}...${end}`;
}
