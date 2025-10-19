/**
 * POST /api/blockchain/mint-certificate
 *
 * Mints an NFT copyright certificate on Polygon Amoy blockchain
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserCustodialWallet, getUserWalletAddress } from '../../../../lib/wallet-manager.js';
import {
  createNFTMetadata,
  mintCopyrightNFT,
  createCertificateRecord,
  isValidSHA256,
  isValidCategory
} from '../../../../lib/blockchain-minting.js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST handler for minting copyright certificates
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      userId,
      workId,
      workTitle,
      workDescription,
      workHash,
      category,
      creatorName
    } = body;

    // ==========================================
    // STEP 1: VALIDATE INPUT
    // ==========================================

    // Check required fields
    if (!userId || !workTitle || !workDescription || !workHash || !category || !creatorName) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'All fields are required: userId, workTitle, workDescription, workHash, category, creatorName'
        },
        { status: 400 }
      );
    }

    // Validate work hash format
    if (!isValidSHA256(workHash)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_HASH',
          message: 'Work hash must be a valid SHA-256 hash (64 hexadecimal characters)'
        },
        { status: 400 }
      );
    }

    // Validate category
    if (!isValidCategory(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CATEGORY',
          message: 'Category must be one of: music, art, video, writing, design, other'
        },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 2: CHECK FOR EXISTING CERTIFICATE
    // ==========================================

    if (workId) {
      const { data: existingCert } = await supabaseAdmin
        .from('copyright_certificates')
        .select('id, token_id, transaction_hash')
        .eq('creative_work_id', workId)
        .eq('minting_status', 'confirmed')
        .single();

      if (existingCert) {
        return NextResponse.json(
          {
            success: false,
            error: 'CERTIFICATE_EXISTS',
            message: 'A copyright certificate already exists for this work',
            existingCertificate: {
              id: existingCert.id,
              tokenId: existingCert.token_id,
              transactionHash: existingCert.transaction_hash
            }
          },
          { status: 409 }
        );
      }
    }

    // ==========================================
    // STEP 3: GET USER'S CUSTODIAL WALLET (for receiving the NFT)
    // ==========================================

    // Get user's wallet address (where NFT will be sent)
    const walletInfo = await getUserWalletAddress(userId);

    if (!walletInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WALLET',
          message: 'User does not have a custodial wallet. Please create one first.'
        },
        { status: 404 }
      );
    }

    const walletAddress = walletInfo.address;

    console.log(`Minting certificate for user ${userId} to wallet ${walletAddress}`);
    console.log(`Using master minting wallet for transaction`);

    // ==========================================
    // STEP 4: CREATE NFT METADATA
    // ==========================================

    const metadata = createNFTMetadata({
      workTitle,
      workDescription,
      workHash,
      category: category.toLowerCase(),
      creatorName,
      workId
    });

    console.log('Created metadata:', JSON.stringify(metadata, null, 2));

    // ==========================================
    // STEP 5: MINT NFT ON BLOCKCHAIN (using master wallet)
    // ==========================================

    let mintResult;
    try {
      mintResult = await mintCopyrightNFT({
        recipientAddress: walletAddress,
        metadata,
        useMasterWallet: true  // Use the master minting wallet
      });

      console.log('Minting successful:', mintResult);
    } catch (mintError) {
      console.error('Minting failed:', mintError);

      // Save failed attempt to database
      if (workId) {
        await supabaseAdmin
          .from('copyright_certificates')
          .insert({
            creative_work_id: workId,
            user_id: userId,
            token_id: 'failed',
            transaction_hash: 'failed',
            wallet_address: walletAddress,
            metadata,
            polygonscan_url: '',
            minting_status: 'failed'
          })
          .catch(err => console.error('Failed to save error record:', err));
      }

      return NextResponse.json(
        {
          success: false,
          error: 'MINTING_FAILED',
          message: `Blockchain minting failed: ${mintError.message}`,
          details: mintError.message
        },
        { status: 500 }
      );
    }

    // ==========================================
    // STEP 6: SAVE CERTIFICATE TO DATABASE
    // ==========================================

    // Generate a UUID for workId if not provided (database requires it)
    const effectiveWorkId = workId || crypto.randomUUID();

    const certificateRecord = createCertificateRecord({
      mintResult,
      metadata,
      userId,
      workId: effectiveWorkId,
      walletAddress
    });

    const { data: certificate, error: dbError } = await supabaseAdmin
      .from('copyright_certificates')
      .insert(certificateRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Minting succeeded but database save failed
      // Return success with warning
      return NextResponse.json(
        {
          success: true,
          warning: 'Certificate minted but database save failed',
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          polygonscanUrl: certificateRecord.polygonscan_url,
          walletAddress,
          metadata,
          mintedAt: certificateRecord.minted_at,
          dbError: dbError.message
        },
        { status: 201 }
      );
    }

    // ==========================================
    // STEP 7: RETURN SUCCESS RESPONSE
    // ==========================================

    console.log(`Certificate ${certificate.id} minted successfully`);

    return NextResponse.json(
      {
        success: true,
        certificateId: certificate.id,
        tokenId: certificate.token_id,
        transactionHash: certificate.transaction_hash,
        polygonscanUrl: certificate.polygonscan_url,
        walletAddress: certificate.wallet_address,
        metadata: certificate.metadata,
        mintedAt: certificate.minted_at,
        status: certificate.minting_status
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in mint-certificate:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while minting certificate',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get certificate by work ID or token ID
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('workId');
    const tokenId = searchParams.get('tokenId');

    if (!workId && !tokenId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PARAMS',
          message: 'Either workId or tokenId is required'
        },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('copyright_certificates')
      .select('*');

    if (workId) {
      query = query.eq('creative_work_id', workId);
    } else if (tokenId) {
      query = query.eq('token_id', tokenId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Certificate not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: data
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      },
      { status: 500 }
    );
  }
}
