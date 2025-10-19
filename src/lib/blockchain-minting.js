/**
 * Blockchain NFT Minting Functions
 *
 * Handles NFT minting operations using thirdweb v5 SDK
 * for copyright certificate generation on Polygon Amoy
 */

import { getContract, prepareContractCall, sendTransaction, waitForReceipt, readContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { getThirdwebSDK, getContractAddresses, AMOY_CHAIN, getPolygonscanUrl } from './blockchain.js';

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
 * @param {string} [params.privateKey] - Private key for signing (optional if useMasterWallet is true)
 * @param {Object} params.metadata - NFT metadata object
 * @param {boolean} [params.useMasterWallet] - Use master minting wallet from env
 * @returns {Promise<Object>} Minting result with tokenId and txHash
 * @throws {Error} If minting fails
 */
export async function mintCopyrightNFT({ recipientAddress, privateKey, metadata, useMasterWallet = false }) {
  try {
    // Determine which private key to use
    let signingKey = privateKey;

    if (useMasterWallet) {
      // Use master minting wallet from environment
      signingKey = process.env.MINTING_WALLET_PRIVATE_KEY;
      if (!signingKey) {
        throw new Error('MINTING_WALLET_PRIVATE_KEY not found in environment variables');
      }
    }

    // Validate inputs
    if (!recipientAddress || !signingKey || !metadata) {
      throw new Error('Missing required parameters for minting');
    }

    // Initialize thirdweb client
    const client = getThirdwebSDK();

    // Create account from private key (either master wallet or user's custodial wallet)
    const account = privateKeyToAccount({
      client,
      privateKey: signingKey.startsWith('0x') ? signingKey : `0x${signingKey}`
    });

    // Get contract instance
    const contractAddresses = getContractAddresses();
    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.COPYRIGHT
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
    // ERC721 Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    // Topics: [0] = event signature, [1] = from, [2] = to, [3] = tokenId
    let tokenId = 'unknown';

    try {
      // Look for the Transfer event in logs
      for (const log of receipt.logs || []) {
        // Check if this is a Transfer event (topics[0] should be the Transfer event signature)
        if (log.topics && log.topics.length >= 4) {
          // Topics[3] contains the tokenId for indexed parameters
          tokenId = BigInt(log.topics[3]).toString();
          break;
        }
      }

      // Fallback: If we still don't have tokenId, try to get total supply - 1
      if (tokenId === 'unknown') {
        console.warn('Could not extract tokenId from logs, attempting to fetch from contract...');
        try {
          const supply = await getTotalSupply();
          tokenId = (supply - 1).toString(); // Last minted token
        } catch (supplyError) {
          console.error('Failed to get total supply:', supplyError.message);
        }
      }
    } catch (error) {
      console.error('Error extracting token ID:', error);
    }

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
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.COPYRIGHT
    });

    // Read tokenURI using readContract
    const uri = await readContract({
      contract,
      method: 'function tokenURI(uint256 tokenId) view returns (string)',
      params: [BigInt(tokenId)]
    });

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
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.COPYRIGHT
    });

    const owner = await readContract({
      contract,
      method: 'function ownerOf(uint256 tokenId) view returns (address)',
      params: [BigInt(tokenId)]
    });

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
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.COPYRIGHT
    });

    const supply = await readContract({
      contract,
      method: 'function totalSupply() view returns (uint256)',
      params: []
    });

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
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.COPYRIGHT
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

// ============================================
// LICENSE NFT FUNCTIONS
// ============================================

/**
 * Validate license type
 * @param {string} licenseType - License type to validate
 * @returns {boolean} True if valid license type
 */
export function isValidLicenseType(licenseType) {
  const validTypes = ['personal', 'commercial_event', 'broadcast_1year', 'exclusive'];
  return validTypes.includes(licenseType?.toLowerCase());
}

/**
 * Create NFT metadata for license certificate
 * @param {Object} params - Metadata parameters
 * @param {string} params.licenseType - Type of license (personal, commercial_event, etc.)
 * @param {string} params.workTitle - Title of the licensed work
 * @param {string} params.creatorName - Name of the original creator
 * @param {string} params.terms - License terms text
 * @param {string} params.expiryDate - ISO timestamp of expiry (or null for perpetual)
 * @param {number} params.usageLimit - Maximum uses allowed (or null for unlimited)
 * @param {number} params.purchaseAmount - Purchase amount in BIDR
 * @param {string} params.orderId - Order ID reference
 * @param {string} [params.licenseId] - Optional license ID for external URL
 * @returns {Object} NFT metadata object
 */
export function createLicenseNFTMetadata({
  licenseType,
  workTitle,
  creatorName,
  terms,
  expiryDate,
  usageLimit,
  purchaseAmount,
  orderId,
  licenseId = null
}) {
  const timestamp = new Date().toISOString();
  const formattedLicenseType = licenseType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const metadata = {
    name: `License: ${formattedLicenseType} - ${workTitle}`,
    description: `Usage license for '${workTitle}' by ${creatorName}.${expiryDate ? ` Valid until ${new Date(expiryDate).toLocaleDateString()}.` : ' Perpetual license.'}`,
    image: 'ipfs://QmYourLicenseCertificateTemplateImageHash', // TODO: Replace with actual license certificate image
    external_url: licenseId ? `https://creativechain.app/licenses/${licenseId}` : 'https://creativechain.app',
    attributes: [
      {
        trait_type: 'License Type',
        value: formattedLicenseType
      },
      {
        trait_type: 'Work Title',
        value: workTitle
      },
      {
        trait_type: 'Creator',
        value: creatorName
      },
      {
        trait_type: 'Purchase Date',
        value: timestamp
      },
      {
        trait_type: 'Expiry Date',
        value: expiryDate || 'Perpetual'
      },
      {
        trait_type: 'Usage Limit',
        value: usageLimit !== null && usageLimit !== undefined ? usageLimit.toString() : 'Unlimited'
      },
      {
        trait_type: 'Purchase Amount',
        value: `${purchaseAmount} BIDR`
      },
      {
        trait_type: 'Valid',
        value: 'true'
      }
    ],
    // Additional custom fields
    license_terms: terms,
    expiry_date: expiryDate,
    usage_limit: usageLimit,
    purchase_amount: purchaseAmount,
    order_id: orderId,
    created_at: timestamp,
    platform: 'CreativeChain'
  };

  return metadata;
}

/**
 * Mint license NFT certificate using thirdweb v5
 * @param {Object} params - Minting parameters
 * @param {string} params.recipientAddress - Wallet address to receive NFT
 * @param {string} [params.privateKey] - Private key for signing (optional if useMasterWallet is true)
 * @param {Object} params.metadata - NFT metadata object
 * @param {boolean} [params.useMasterWallet] - Use master minting wallet from env
 * @returns {Promise<Object>} Minting result with tokenId and txHash
 * @throws {Error} If minting fails
 */
export async function mintLicenseNFT({ recipientAddress, privateKey, metadata, useMasterWallet = false }) {
  try {
    // Determine which private key to use
    let signingKey = privateKey;

    if (useMasterWallet) {
      // Use master minting wallet from environment
      signingKey = process.env.MINTING_WALLET_PRIVATE_KEY;
      if (!signingKey) {
        throw new Error('MINTING_WALLET_PRIVATE_KEY not found in environment variables');
      }
    }

    // Validate inputs
    if (!recipientAddress || !signingKey || !metadata) {
      throw new Error('Missing required parameters for minting');
    }

    // Initialize thirdweb client
    const client = getThirdwebSDK();

    // Create account from private key (either master wallet or user's custodial wallet)
    const account = privateKeyToAccount({
      client,
      privateKey: signingKey.startsWith('0x') ? signingKey : `0x${signingKey}`
    });

    // Get contract instance for LICENSE contract
    const contractAddresses = getContractAddresses();
    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.LICENSE
    });

    // Prepare the mintTo transaction
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
    let tokenId = 'unknown';

    try {
      // Look for the Transfer event in logs
      for (const log of receipt.logs || []) {
        if (log.topics && log.topics.length >= 4) {
          tokenId = BigInt(log.topics[3]).toString();
          break;
        }
      }

      // Fallback: If we still don't have tokenId, try to get total supply - 1
      if (tokenId === 'unknown') {
        console.warn('Could not extract tokenId from logs, attempting to fetch from contract...');
        try {
          const supply = await getLicenseTotalSupply();
          tokenId = (supply - 1).toString(); // Last minted token
        } catch (supplyError) {
          console.error('Failed to get total supply:', supplyError.message);
        }
      }
    } catch (error) {
      console.error('Error extracting token ID:', error);
    }

    return {
      success: true,
      tokenId,
      transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status
    };
  } catch (error) {
    console.error('License minting error:', error);
    throw new Error(`Failed to mint license NFT: ${error.message}`);
  }
}

/**
 * Get total supply of minted license NFTs
 * @returns {Promise<number>} Total number of license NFTs minted
 */
export async function getLicenseTotalSupply() {
  try {
    const client = getThirdwebSDK();
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.LICENSE
    });

    const supply = await readContract({
      contract,
      method: 'function totalSupply() view returns (uint256)',
      params: []
    });

    return Number(supply);
  } catch (error) {
    throw new Error(`Failed to get license total supply: ${error.message}`);
  }
}

/**
 * Get license NFT metadata from blockchain
 * @param {string} tokenId - Token ID to query
 * @returns {Promise<Object>} NFT metadata
 */
export async function getLicenseNFTMetadata(tokenId) {
  try {
    const client = getThirdwebSDK();
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.LICENSE
    });

    // Read tokenURI using readContract
    const uri = await readContract({
      contract,
      method: 'function tokenURI(uint256 tokenId) view returns (string)',
      params: [BigInt(tokenId)]
    });

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
    throw new Error(`Failed to get license NFT metadata: ${error.message}`);
  }
}

/**
 * Verify license NFT ownership
 * @param {string} tokenId - Token ID to check
 * @param {string} ownerAddress - Expected owner address
 * @returns {Promise<boolean>} True if address owns the token
 */
export async function verifyLicenseNFTOwnership(tokenId, ownerAddress) {
  try {
    const client = getThirdwebSDK();
    const contractAddresses = getContractAddresses();

    const contract = getContract({
      client,
      chain: AMOY_CHAIN,
      address: contractAddresses.LICENSE
    });

    const owner = await readContract({
      contract,
      method: 'function ownerOf(uint256 tokenId) view returns (address)',
      params: [BigInt(tokenId)]
    });

    return owner.toLowerCase() === ownerAddress.toLowerCase();
  } catch (error) {
    console.error('License ownership verification error:', error);
    return false;
  }
}

/**
 * Create full license record with all metadata
 * @param {Object} mintResult - Result from mintLicenseNFT
 * @param {Object} metadata - NFT metadata
 * @param {string} buyerUserId - Buyer user ID (buyer_id in DB)
 * @param {string} workId - Creative work ID (work_id in DB)
 * @param {string} licenseOfferingId - License offering ID
 * @param {string} orderId - Order ID
 * @param {string} licenseType - License type
 * @param {string} expiryDate - Expiry date (ISO string or null)
 * @param {number} usageLimit - Usage limit (or null)
 * @param {number} priceBidr - Price in USDT
 * @param {string} transactionHash - Payment transaction hash
 * @param {string} walletAddress - Recipient wallet address
 * @param {string} nftContractAddress - NFT contract address
 * @returns {Object} Complete license record for database
 */
export function createLicenseRecord({
  mintResult,
  metadata,
  buyerUserId,
  workId,
  licenseOfferingId,
  orderId,
  licenseType,
  expiryDate,
  usageLimit,
  priceBidr,
  transactionHash,
  walletAddress,
  nftContractAddress
}) {
  return {
    // Existing schema columns
    work_id: workId,
    buyer_id: buyerUserId,
    license_type: licenseType,
    price_bidr: priceBidr,
    transaction_hash: transactionHash, // Payment transaction hash
    order_id: orderId,
    license_offering_id: licenseOfferingId,

    // NFT-related columns (newly added or existing)
    nft_token_id: mintResult.tokenId,
    nft_contract_address: nftContractAddress,
    nft_transaction_hash: mintResult.transactionHash,

    // Expiry and usage columns (existing)
    expires_at: expiryDate,
    usage_count: 0,
    usage_limit: usageLimit,

    // New columns added by migration
    metadata: metadata,
    wallet_address: walletAddress,
    is_valid: true

    // Note: purchased_at will be set by database default (NOW())
  };
}
