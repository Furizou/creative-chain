/**
 * POST /api/blockchain/mint-license
 *
 * Mints an NFT license certificate on Polygon Amoy blockchain
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserWalletAddress } from '../../../../lib/wallet-manager.js';
import {
  createLicenseNFTMetadata,
  mintLicenseNFT,
  createLicenseRecord,
  isValidLicenseType
} from '../../../../lib/blockchain-minting.js';
import { getPolygonscanUrl, getContractAddresses } from '../../../../lib/blockchain.js';

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
 * POST handler for minting license certificates
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      buyerUserId,      // Maps to buyer_id
      workId,           // Maps to work_id (required in existing schema)
      licenseOfferingId,
      orderId,
      licenseType,
      workTitle,        // For metadata only
      creatorName,      // For metadata only
      terms,
      expiryDate,
      usageLimit,
      priceBidr,        // Maps to price_bidr (required in existing schema)
      transactionHash   // Payment transaction hash (required in existing schema)
    } = body;

    // ==========================================
    // STEP 1: VALIDATE INPUT
    // ==========================================

    // Check required fields
    if (!buyerUserId || !workId || !licenseOfferingId || !orderId || !licenseType || !workTitle || !creatorName || !terms || !priceBidr || !transactionHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Required fields: buyerUserId, workId, licenseOfferingId, orderId, licenseType, workTitle, creatorName, terms, priceBidr, transactionHash'
        },
        { status: 400 }
      );
    }

    // Validate license type
    if (!isValidLicenseType(licenseType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_LICENSE_TYPE',
          message: 'License type must be one of: personal, commercial_event, broadcast_1year, exclusive'
        },
        { status: 400 }
      );
    }

    // Validate expiry date if provided
    if (expiryDate) {
      const expiryTimestamp = new Date(expiryDate);
      if (isNaN(expiryTimestamp.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_DATE',
            message: 'Expiry date must be a valid ISO 8601 timestamp'
          },
          { status: 400 }
        );
      }

      // Check if expiry date is in the future
      if (expiryTimestamp < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_DATE',
            message: 'Expiry date must be in the future'
          },
          { status: 400 }
        );
      }
    }

    // Validate usage limit if provided
    if (usageLimit !== null && usageLimit !== undefined) {
      if (typeof usageLimit !== 'number' || usageLimit < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_USAGE_LIMIT',
            message: 'Usage limit must be a non-negative number'
          },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // STEP 2: VALIDATE BUYER USER EXISTS
    // ==========================================

    const { data: buyer, error: buyerError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('id', buyerUserId)
      .single();

    // Note: Direct auth.users query might not work depending on RLS
    // Alternatively, check if user has a wallet (indirect validation)

    // ==========================================
    // STEP 3: VALIDATE ORDER EXISTS AND IS PAID
    // ==========================================

    // Note: This validation will be enabled once orders table is implemented
    // For now, we'll skip this check to allow testing without orders system

    // const { data: order, error: orderError } = await supabaseAdmin
    //   .from('orders')
    //   .select('id, status')
    //   .eq('id', orderId)
    //   .single();
    //
    // if (orderError || !order) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'INVALID_ORDER',
    //       message: 'Order not found'
    //     },
    //     { status: 404 }
    //   );
    // }
    //
    // if (order.status !== 'paid') {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'INVALID_ORDER',
    //       message: 'Order must be in paid status before minting license'
    //     },
    //     { status: 400 }
    //   );
    // }

    // ==========================================
    // STEP 4: CHECK FOR EXISTING LICENSE
    // ==========================================

    const { data: existingLicense } = await supabaseAdmin
      .from('licenses')
      .select('id, token_id, transaction_hash')
      .eq('order_id', orderId)
      .single();

    if (existingLicense) {
      return NextResponse.json(
        {
          success: false,
          error: 'LICENSE_EXISTS',
          message: 'A license already exists for this order',
          existingLicense: {
            id: existingLicense.id,
            tokenId: existingLicense.token_id,
            transactionHash: existingLicense.transaction_hash
          }
        },
        { status: 409 }
      );
    }

    // ==========================================
    // STEP 5: GET BUYER'S CUSTODIAL WALLET
    // ==========================================

    const walletInfo = await getUserWalletAddress(buyerUserId);

    if (!walletInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'WALLET_NOT_FOUND',
          message: 'Buyer does not have a custodial wallet. Please create one first.'
        },
        { status: 404 }
      );
    }

    const walletAddress = walletInfo.address;

    console.log(`Minting license for buyer ${buyerUserId} to wallet ${walletAddress}`);
    console.log(`License type: ${licenseType}, Order: ${orderId}`);

    // ==========================================
    // STEP 6: CREATE LICENSE NFT METADATA
    // ==========================================

    const metadata = createLicenseNFTMetadata({
      licenseType,
      workTitle,
      creatorName,
      terms,
      expiryDate: expiryDate || null,
      usageLimit: usageLimit !== null && usageLimit !== undefined ? usageLimit : null,
      purchaseAmount: priceBidr,
      orderId,
      licenseId: null // Will be set after database insert
    });

    console.log('Created license metadata:', JSON.stringify(metadata, null, 2));

    // ==========================================
    // STEP 7: MINT LICENSE NFT ON BLOCKCHAIN
    // ==========================================

    let mintResult;
    try {
      mintResult = await mintLicenseNFT({
        recipientAddress: walletAddress,
        metadata,
        useMasterWallet: true  // Use the master minting wallet
      });

      console.log('License minting successful:', mintResult);
    } catch (mintError) {
      console.error('License minting failed:', mintError);

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
    // STEP 8: SAVE LICENSE TO DATABASE
    // ==========================================

    // Get the contract address from environment
    const contractAddresses = getContractAddresses();
    const nftContractAddress = contractAddresses.LICENSE;

    const licenseRecord = createLicenseRecord({
      mintResult,
      metadata,
      buyerUserId,
      workId,
      licenseOfferingId,
      orderId,
      licenseType,
      expiryDate: expiryDate || null,
      usageLimit: usageLimit !== null && usageLimit !== undefined ? usageLimit : null,
      priceBidr,
      transactionHash,
      walletAddress,
      nftContractAddress
    });

    const { data: license, error: dbError } = await supabaseAdmin
      .from('licenses')
      .insert(licenseRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Minting succeeded but database save failed
      // Return success with warning
      return NextResponse.json(
        {
          success: true,
          warning: 'License minted but database save failed',
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          polygonscanUrl: getPolygonscanUrl(mintResult.transactionHash, 'amoy'),
          walletAddress,
          metadata,
          mintedAt: licenseRecord.minted_at,
          dbError: dbError.message
        },
        { status: 201 }
      );
    }

    // ==========================================
    // STEP 9: UPDATE ORDER STATUS (when implemented)
    // ==========================================

    // TODO: Update order status to 'completed' after successful mint
    // await supabaseAdmin
    //   .from('orders')
    //   .update({ status: 'completed' })
    //   .eq('id', orderId);

    // ==========================================
    // STEP 10: RETURN SUCCESS RESPONSE
    // ==========================================

    console.log(`License ${license.id} minted successfully`);

    return NextResponse.json(
      {
        success: true,
        licenseId: license.id,
        tokenId: license.token_id,
        transactionHash: license.transaction_hash,
        polygonscanUrl: getPolygonscanUrl(license.transaction_hash, 'amoy'),
        walletAddress: license.wallet_address,
        licenseDetails: {
          type: license.license_type,
          expiryDate: license.expires_at,
          usageLimit: license.usage_limit,
          terms: terms,
          workTitle: workTitle,
          creator: creatorName
        },
        metadata: license.metadata,
        mintedAt: license.minted_at
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in mint-license:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while minting license',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get license by ID, order ID, or token ID
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId');
    const orderId = searchParams.get('orderId');
    const tokenId = searchParams.get('tokenId');
    const buyerUserId = searchParams.get('buyerUserId');

    if (!licenseId && !orderId && !tokenId && !buyerUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PARAMS',
          message: 'At least one of licenseId, orderId, tokenId, or buyerUserId is required'
        },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('licenses')
      .select('*');

    if (licenseId) {
      query = query.eq('id', licenseId);
    } else if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (tokenId) {
      query = query.eq('nft_token_id', tokenId);
    } else if (buyerUserId) {
      // Return all licenses for this buyer
      const { data, error } = await query.eq('buyer_id', buyerUserId);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'QUERY_ERROR',
            message: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        licenses: data || []
      });
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'License not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      license: data
    });

  } catch (error) {
    console.error('Error fetching license:', error);

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
