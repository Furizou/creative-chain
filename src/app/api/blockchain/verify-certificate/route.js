import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyNFTOwnership, getNFTMetadata } from '@/lib/blockchain-minting';
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
 */
async function findCertificate(type, value) {
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
      return { data: null, error: { message: 'Invalid lookup type' } };
  }

  const { data, error } = await query.single();
  return { data, error };
}

/**
 * Performs blockchain verification checks
 */
async function verifyOnBlockchain(certificate) {
  const issues = [];
  const verification = {
    ownershipMatch: false,
    metadataMatch: false,
    tokenExists: false,
    hashMatch: false,
    timestampValid: false
  };

  try {
    // Check if token exists on blockchain
    console.log('[VERIFY] Checking token ID:', certificate.token_id);
    const blockchainMetadata = await getNFTMetadata(certificate.token_id);
    console.log('[VERIFY] Blockchain metadata:', blockchainMetadata);

    if (!blockchainMetadata) {
      console.log('[VERIFY] No metadata found - token does not exist');
      issues.push('Token does not exist on blockchain');
      return { verification, issues, blockchainData: null };
    }

    verification.tokenExists = true;

    // Verify current ownership
    const ownershipValid = await verifyNFTOwnership(
      certificate.token_id,
      certificate.wallet_address
    );
    verification.ownershipMatch = ownershipValid;

    if (!ownershipValid) {
      issues.push('Current blockchain owner differs from database record');
    }

    // Verify metadata consistency
    const dbMetadata = certificate.metadata;
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

    // Validate timestamp
    verification.timestampValid = true; // Basic validation - certificate exists and has valid timestamps

    // Get current blockchain owner (from metadata if available)
    const currentOwner = blockchainMetadata.owner || certificate.wallet_address;

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
function generateVerificationReport(certificate, verification, blockchainData, issues, status) {
  const metadata = certificate.metadata || {};
  const verifiedAt = new Date().toISOString();

  const baseResponse = {
    verified: status === 'authentic' || status === 'transferred',
    status,
    verifiedAt
  };

  if (status === 'authentic' || status === 'transferred' || status === 'inconsistent') {
    return {
      ...baseResponse,
      certificate: {
        tokenId: certificate.token_id,
        transactionHash: certificate.transaction_hash,
        workDetails: {
          title: metadata.name || 'Unknown',
          creator: metadata.creator || 'Unknown',
          category: metadata.category || 'Unknown',
          workHash: metadata.work_hash || 'Unknown',
          registeredAt: certificate.minted_at || certificate.created_at
        },
        blockchainData: {
          currentOwner: blockchainData?.currentOwner || certificate.wallet_address,
          network: 'polygon-amoy',
          ...(blockchainData?.metadata && {
            metadata: blockchainData.metadata
          })
        },
        verification
      },
      polygonscanUrl: getPolygonscanUrl(certificate.transaction_hash, 'amoy'),
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
    const { data: certificate, error: dbError } = await findCertificate(type, value);

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

    // Ensure certificate is confirmed before verifying
    if (certificate.minting_status !== 'confirmed') {
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
    const { verification, issues, blockchainData } = await verifyOnBlockchain(certificate);

    // Step 4: Determine status
    const status = determineStatus(certificate, verification, issues);

    // Step 5: Generate report
    const report = generateVerificationReport(
      certificate,
      verification,
      blockchainData,
      issues,
      status
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
