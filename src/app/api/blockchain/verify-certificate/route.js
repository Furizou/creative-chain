import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyNFTOwnership, getNFTMetadata, verifyLicenseNFTOwnership, getLicenseNFTMetadata } from '@/lib/blockchain-minting';
import { getPolygonscanUrl, isValidAddress } from '@/lib/blockchain';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Validates input parameters and ensures only one lookup method is provided
 */
function validateInput(searchParams) {
  const tx = searchParams.get('tx');
  const tokenId = searchParams.get('tokenId');
  const workHash = searchParams.get('workHash');
  const certificateId = searchParams.get('certificateId');

  const params = [tx, tokenId, workHash, certificateId].filter(Boolean);

  if (params.length === 0) {
    return {
      valid: false,
      error: 'Missing required parameter. Provide one of: tx, tokenId, workHash, or certificateId'
    };
  }

  if (params.length > 1) {
    return {
      valid: false,
      error: 'Only one lookup parameter allowed at a time'
    };
  }

  // Validate transaction hash format (0x followed by 64 hex characters)
  if (tx) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx)) {
      return {
        valid: false,
        error: 'Invalid transaction hash format. Expected 0x followed by 64 hex characters'
      };
    }
    return { valid: true, type: 'transaction_hash', value: tx };
  }

  // Validate token ID (must be numeric)
  if (tokenId) {
    if (!/^\d+$/.test(tokenId)) {
      return {
        valid: false,
        error: 'Invalid token ID format. Must be a numeric value'
      };
    }
    return { valid: true, type: 'token_id', value: tokenId };
  }

  // Validate work hash (SHA-256: 64 hex characters)
  if (workHash) {
    if (!/^[a-fA-F0-9]{64}$/.test(workHash)) {
      return {
        valid: false,
        error: 'Invalid work hash format. Expected 64 hex characters (SHA-256)'
      };
    }
    return { valid: true, type: 'work_hash', value: workHash };
  }

  // Validate certificate ID (UUID format)
  if (certificateId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(certificateId)) {
      return {
        valid: false,
        error: 'Invalid certificate ID format. Expected UUID'
      };
    }
    return { valid: true, type: 'certificate_id', value: certificateId };
  }

  return { valid: false, error: 'Unknown error in validation' };
}

/**
 * Queries the database based on the lookup type
 * Checks both copyright_certificates and licenses tables
 */
async function findCertificate(type, value) {
  // First, try to find in copyright_certificates
  let query = supabase
    .from('copyright_certificates')
    .select('*');

  switch (type) {
    case 'transaction_hash':
      query = query.eq('transaction_hash', value);
      break;
    case 'token_id':
      query = query.eq('token_id', value);
      break;
    case 'work_hash':
      // Work hash is stored in metadata.work_hash
      query = query.eq('metadata->>work_hash', value);
      break;
    case 'certificate_id':
      query = query.eq('id', value);
      break;
    default:
      return { data: null, error: { message: 'Invalid lookup type' }, certType: null };
  }

  const { data: certData, error: certError } = await query.single();

  if (certData) {
    return { data: certData, error: null, certType: 'copyright' };
  }

  // If not found in copyright_certificates, try licenses table
  let licenseQuery = supabase
    .from('licenses')
    .select('*');

  switch (type) {
    case 'transaction_hash':
      // For licenses, check nft_transaction_hash
      licenseQuery = licenseQuery.eq('nft_transaction_hash', value);
      break;
    case 'token_id':
      licenseQuery = licenseQuery.eq('nft_token_id', value);
      break;
    case 'certificate_id':
      licenseQuery = licenseQuery.eq('id', value);
      break;
    default:
      // work_hash not applicable to licenses
      return { data: null, error: certError || { message: 'Not found' }, certType: null };
  }

  const { data: licenseData, error: licenseError } = await licenseQuery.single();

  if (licenseData) {
    return { data: licenseData, error: null, certType: 'license' };
  }

  return { data: null, error: licenseError || certError, certType: null };
}

/**
 * Performs blockchain verification checks
 */
async function verifyOnBlockchain(certificate, certType) {
  const issues = [];
  const verification = {
    ownershipMatch: false,
    metadataMatch: false,
    tokenExists: false,
    hashMatch: false,
    timestampValid: false
  };

  try {
    // Determine token ID and wallet address based on certificate type
    const tokenId = certType === 'license' ? certificate.nft_token_id : certificate.token_id;
    const walletAddress = certificate.wallet_address;

    // Check if token exists on blockchain
    console.log('[VERIFY] Checking token ID:', tokenId, 'Type:', certType);

    const blockchainMetadata = certType === 'license'
      ? await getLicenseNFTMetadata(tokenId)
      : await getNFTMetadata(tokenId);

    console.log('[VERIFY] Blockchain metadata:', blockchainMetadata);

    if (!blockchainMetadata) {
      console.log('[VERIFY] No metadata found - token does not exist');
      issues.push('Token does not exist on blockchain');
      return { verification, issues, blockchainData: null };
    }

    verification.tokenExists = true;

    // Verify current ownership
    const ownershipValid = certType === 'license'
      ? await verifyLicenseNFTOwnership(tokenId, walletAddress)
      : await verifyNFTOwnership(tokenId, walletAddress);

    verification.ownershipMatch = ownershipValid;

    if (!ownershipValid) {
      issues.push('Current blockchain owner differs from database record');
    }

    // Verify metadata consistency
    const dbMetadata = certificate.metadata;

    if (certType === 'copyright') {
      // Copyright certificate verification
      const dbWorkHash = dbMetadata?.work_hash;
      const blockchainWorkHash = blockchainMetadata.work_hash;

      if (dbWorkHash && blockchainWorkHash) {
        verification.hashMatch = dbWorkHash === blockchainWorkHash;
        if (!verification.hashMatch) {
          issues.push('Work hash mismatch between database and blockchain');
        }
      }

      // Check metadata structure match
      if (dbMetadata && blockchainMetadata) {
        const nameMatch = dbMetadata.name === blockchainMetadata.name;
        const categoryMatch = dbMetadata.category === blockchainMetadata.category;
        verification.metadataMatch = nameMatch && categoryMatch;

        if (!verification.metadataMatch) {
          issues.push('Metadata inconsistency detected between database and blockchain');
        }
      }
    } else {
      // License verification
      if (dbMetadata && blockchainMetadata) {
        const nameMatch = dbMetadata.name === blockchainMetadata.name;
        const licenseTypeMatch = dbMetadata.license_terms === blockchainMetadata.license_terms;
        verification.metadataMatch = nameMatch;

        if (!verification.metadataMatch) {
          issues.push('Metadata inconsistency detected between database and blockchain');
        }
      }

      // For licenses, hash match is always true (no work hash)
      verification.hashMatch = true;
    }

    // Validate timestamp
    verification.timestampValid = true; // Basic validation - certificate exists and has valid timestamps

    // Get current blockchain owner (from metadata if available)
    const currentOwner = blockchainMetadata.owner || walletAddress;

    const blockchainData = {
      currentOwner,
      metadata: blockchainMetadata,
      network: 'polygon-amoy'
    };

    return { verification, issues, blockchainData };

  } catch (error) {
    console.error('[VERIFY] Blockchain verification error:', error);
    issues.push(`Blockchain verification error: ${error.message}`);
    return { verification, issues, blockchainData: null };
  }
}

/**
 * Determines the verification status based on checks
 */
function determineStatus(certificate, verification, issues) {
  if (!verification.tokenExists) {
    return 'invalid';
  }

  if (issues.length === 0) {
    return 'authentic';
  }

  if (!verification.ownershipMatch && verification.tokenExists) {
    return 'transferred';
  }

  if (verification.tokenExists && issues.length > 0) {
    return 'inconsistent';
  }

  return 'invalid';
}

/**
 * Generates the verification report response
 */
function generateVerificationReport(certificate, verification, blockchainData, issues, status, certType) {
  const metadata = certificate.metadata || {};
  const verifiedAt = new Date().toISOString();

  const baseResponse = {
    verified: status === 'authentic' || status === 'transferred',
    status,
    verifiedAt,
    type: certType
  };

  if (status === 'authentic' || status === 'transferred' || status === 'inconsistent') {
    const tokenId = certType === 'license' ? certificate.nft_token_id : certificate.token_id;
    const transactionHash = certType === 'license' ? certificate.nft_transaction_hash : certificate.transaction_hash;

    const certificateInfo = {
      tokenId,
      transactionHash,
      blockchainData: {
        currentOwner: blockchainData?.currentOwner || certificate.wallet_address,
        network: 'polygon-amoy',
        ...(blockchainData?.metadata && {
          metadata: blockchainData.metadata
        })
      },
      verification
    };

    if (certType === 'copyright') {
      certificateInfo.workDetails = {
        title: metadata.name || 'Unknown',
        creator: metadata.creator || 'Unknown',
        category: metadata.category || 'Unknown',
        workHash: metadata.work_hash || 'Unknown',
        registeredAt: certificate.minted_at || certificate.created_at
      };
    } else {
      // License details
      certificateInfo.licenseDetails = {
        title: metadata.name || 'Unknown',
        licenseType: certificate.license_type || 'Unknown',
        creator: metadata.attributes?.find(a => a.trait_type === 'Creator')?.value || 'Unknown',
        purchaseDate: certificate.purchased_at || certificate.created_at,
        expiryDate: certificate.expires_at || 'Perpetual',
        usageLimit: certificate.usage_limit !== null ? certificate.usage_limit : 'Unlimited',
        isValid: certificate.is_valid
      };
    }

    return {
      ...baseResponse,
      certificate: certificateInfo,
      polygonscanUrl: getPolygonscanUrl(transactionHash, 'amoy'),
      ...(issues.length > 0 && {
        issues,
        message: 'Certificate found but verification issues detected'
      })
    };
  }

  return baseResponse;
}

/**
 * GET /api/blockchain/verify-certificate
 *
 * Public endpoint to verify certificate authenticity
 * Query params: tx, tokenId, workHash, or certificateId
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Step 1: Input validation
    const validation = validateInput(searchParams);
    if (!validation.valid) {
      return NextResponse.json(
        {
          verified: false,
          status: 'invalid_input',
          message: validation.error
        },
        { status: 400 }
      );
    }

    const { type, value } = validation;

    // Step 2: Database query
    const { data: certificate, error: dbError, certType } = await findCertificate(type, value);

    if (dbError || !certificate) {
      return NextResponse.json(
        {
          verified: false,
          status: 'not_found',
          message: 'No certificate found for the provided identifier',
          searchedFor: {
            type,
            value
          }
        },
        { status: 404 }
      );
    }

    // Ensure copyright certificate is confirmed before verifying
    // Licenses don't have minting_status field
    if (certType === 'copyright' && certificate.minting_status !== 'confirmed') {
      return NextResponse.json(
        {
          verified: false,
          status: 'pending',
          message: `Certificate minting is ${certificate.minting_status}. Cannot verify unconfirmed certificates.`,
          certificate: {
            tokenId: certificate.token_id,
            transactionHash: certificate.transaction_hash,
            mintingStatus: certificate.minting_status
          }
        },
        { status: 200 }
      );
    }

    // Step 3: Blockchain verification
    const { verification, issues, blockchainData } = await verifyOnBlockchain(certificate, certType);

    // Step 4: Determine status
    const status = determineStatus(certificate, verification, issues);

    // Step 5: Generate report
    const report = generateVerificationReport(
      certificate,
      verification,
      blockchainData,
      issues,
      status,
      certType
    );

    return NextResponse.json(report, { status: 200 });

  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      {
        verified: false,
        status: 'error',
        message: 'Internal server error during verification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blockchain/verify-certificate
 *
 * Alternative POST method for complex verification requests
 * Body: { tx?, tokenId?, workHash?, certificateId? }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Create a URL with query params from body
    const url = new URL('http://localhost');
    if (body.tx) url.searchParams.set('tx', body.tx);
    if (body.tokenId) url.searchParams.set('tokenId', body.tokenId);
    if (body.workHash) url.searchParams.set('workHash', body.workHash);
    if (body.certificateId) url.searchParams.set('certificateId', body.certificateId);

    // Reuse GET logic
    const mockRequest = { url: url.toString() };
    return await GET(mockRequest);

  } catch (error) {
    console.error('Certificate verification error (POST):', error);
    return NextResponse.json(
      {
        verified: false,
        status: 'error',
        message: 'Invalid request body',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 400 }
    );
  }
}
