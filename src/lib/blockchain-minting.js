/**
 * Blockchain NFT Minting Functions
 *
 * Handles NFT minting operations using thirdweb v5 SDK
 * for copyright certificate generation on Polygon Amoy
 */

import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { getThirdwebSDK, CONTRACT_ADDRESSES, AMOY_CHAIN, getPolygonscanUrl } from './blockchain.js';

/**
 * Validate SHA-256 hash format
 * @param {string} hash - Hash to validate
 * @returns {boolean} True if valid SHA-256 hash
 */
export function isValidSHA256(hash) {
  if (typeof hash !== 'string') return false;
  // SHA-256 hashes are 64 hexadecimal characters
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate category
 * @param {string} category - Category to validate
 * @returns {boolean} True if valid category
 */
export function isValidCategory(category) {
  const validCategories = ['music', 'art', 'video', 'writing', 'design', 'other'];
  return validCategories.includes(category?.toLowerCase());
}

/**
 * Create NFT metadata for copyright certificate
 * @param {Object} params - Metadata parameters
 * @param {string} params.workTitle - Title of the creative work
 * @param {string} params.workDescription - Description of the work
 * @param {string} params.workHash - SHA-256 hash of the work
 * @param {string} params.category - Category of the work
 * @param {string} params.creatorName - Name of the creator
 * @param {string} [params.workId] - Optional work ID for external URL
 * @returns {Object} NFT metadata object
 */
export function createNFTMetadata({
  workTitle,
  workDescription,
  workHash,
  category,
  creatorName,
  workId = null
}) {
  const timestamp = new Date().toISOString();

  const metadata = {
    name: `Copyright Certificate - ${workTitle}`,
    description: `Immutable copyright certificate for: ${workDescription}`,
    image: 'ipfs://QmYourCertificateTemplateImageHash', // TODO: Replace with actual certificate image
    external_url: workId ? `https://creativechain.app/works/${workId}` : 'https://creativechain.app',
    attributes: [
      {
        trait_type: 'Work Hash',
        value: workHash
      },
      {
        trait_type: 'Creator',
        value: creatorName
      },
      {
        trait_type: 'Category',
        value: category.charAt(0).toUpperCase() + category.slice(1)
      },
      {
        trait_type: 'Registration Date',
        value: timestamp
      },
      {
        trait_type: 'Platform',
        value: 'CreativeChain'
      }
    ],
    // Additional custom fields
    work_hash: workHash,
    created_at: timestamp,
    creator: creatorName,
    category: category,
    platform: 'CreativeChain'
  };

  return metadata;
}

/**
 * Mint copyright NFT certificate using thirdweb v5
 * @param {Object} params - Minting parameters
 * @param {string} params.recipientAddress - Wallet address to receive NFT
 * @param {string} params.privateKey - Private key for signing (from custodial wallet)
 * @param {Object} params.metadata - NFT metadata object
 * @returns {Promise<Object>} Minting result with tokenId and txHash
 * @throws {Error} If minting fails
 */
export async function mintCopyrightNFT({ recipientAddress, privateKey, metadata }) {
  try {
    // Validate inputs
    if (!recipientAddress || !privateKey || !metadata) {
      throw new Error('Missing required parameters for minting');
    }

    // Initialize thirdweb client
    const client = getThirdwebSDK();

    // Create account from private key
    const account = privateKeyToAccount({
      client,
      privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    });

    // Get contract instance
    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: CONTRACT_ADDRESSES.COPYRIGHT
    });

    // Prepare the mintTo transaction
    // For thirdweb v5, we need to prepare the contract call
    const transaction = prepareContractCall({
      contract,
      method: 'function mintTo(address to, string memory uri) returns (uint256)',
      params: [recipientAddress, JSON.stringify(metadata)]
    });

    // Send transaction
    const { transactionHash } = await sendTransaction({
      transaction,
      account
    });

    // Wait for confirmation
    const receipt = await waitForReceipt({
      client,
      chain: AMOY_CHAIN,
      transactionHash
    });

    // Extract token ID from logs
    // The Transfer event is typically at index 0
    const tokenId = receipt.logs?.[0]?.topics?.[3]
      ? BigInt(receipt.logs[0].topics[3]).toString()
      : 'unknown';

    return {
      success: true,
      tokenId,
      transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status
    };
  } catch (error) {
    console.error('Minting error:', error);
    throw new Error(`Failed to mint NFT: ${error.message}`);
  }
}

/**
 * Get NFT metadata from blockchain
 * @param {string} tokenId - Token ID to query
 * @returns {Promise<Object>} NFT metadata
 */
export async function getNFTMetadata(tokenId) {
  try {
    const client = getThirdwebSDK();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: CONTRACT_ADDRESSES.COPYRIGHT
    });

    // Read tokenURI
    const transaction = prepareContractCall({
      contract,
      method: 'function tokenURI(uint256 tokenId) view returns (string)',
      params: [BigInt(tokenId)]
    });

    const uri = await transaction.simulate();

    // If URI is JSON string, parse it
    if (uri.startsWith('{')) {
      return JSON.parse(uri);
    }

    // If URI is IPFS or HTTP, fetch it
    if (uri.startsWith('ipfs://') || uri.startsWith('http')) {
      const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
      return await response.json();
    }

    return { uri };
  } catch (error) {
    throw new Error(`Failed to get NFT metadata: ${error.message}`);
  }
}

/**
 * Verify NFT ownership
 * @param {string} tokenId - Token ID to check
 * @param {string} ownerAddress - Expected owner address
 * @returns {Promise<boolean>} True if address owns the token
 */
export async function verifyNFTOwnership(tokenId, ownerAddress) {
  try {
    const client = getThirdwebSDK();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: CONTRACT_ADDRESSES.COPYRIGHT
    });

    const transaction = prepareContractCall({
      contract,
      method: 'function ownerOf(uint256 tokenId) view returns (address)',
      params: [BigInt(tokenId)]
    });

    const owner = await transaction.simulate();

    return owner.toLowerCase() === ownerAddress.toLowerCase();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return false;
  }
}

/**
 * Get total supply of minted NFTs
 * @returns {Promise<number>} Total number of NFTs minted
 */
export async function getTotalSupply() {
  try {
    const client = getThirdwebSDK();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: CONTRACT_ADDRESSES.COPYRIGHT
    });

    const transaction = prepareContractCall({
      contract,
      method: 'function totalSupply() view returns (uint256)',
      params: []
    });

    const supply = await transaction.simulate();

    return Number(supply);
  } catch (error) {
    throw new Error(`Failed to get total supply: ${error.message}`);
  }
}

/**
 * Estimate gas for minting
 * @param {Object} params - Minting parameters
 * @returns {Promise<string>} Estimated gas amount
 */
export async function estimateMintGas({ recipientAddress, metadata }) {
  try {
    const client = getThirdwebSDK();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: CONTRACT_ADDRESSES.COPYRIGHT
    });

    const transaction = prepareContractCall({
      contract,
      method: 'function mintTo(address to, string memory uri) returns (uint256)',
      params: [recipientAddress, JSON.stringify(metadata)]
    });

    // Estimate gas
    const gasEstimate = await transaction.estimateGas();

    return gasEstimate.toString();
  } catch (error) {
    throw new Error(`Failed to estimate gas: ${error.message}`);
  }
}

/**
 * Create full certificate record with all metadata
 * @param {Object} mintResult - Result from mintCopyrightNFT
 * @param {Object} metadata - NFT metadata
 * @param {string} userId - User ID
 * @param {string} workId - Creative work ID
 * @param {string} walletAddress - Recipient wallet address
 * @returns {Object} Complete certificate record for database
 */
export function createCertificateRecord({
  mintResult,
  metadata,
  userId,
  workId,
  walletAddress
}) {
  return {
    creative_work_id: workId,
    user_id: userId,
    token_id: mintResult.tokenId,
    transaction_hash: mintResult.transactionHash,
    wallet_address: walletAddress,
    metadata: metadata,
    polygonscan_url: getPolygonscanUrl(mintResult.transactionHash, 'amoy'),
    minting_status: 'confirmed',
    minted_at: new Date().toISOString()
  };
}
