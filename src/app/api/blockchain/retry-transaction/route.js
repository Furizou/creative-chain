/**
 * POST /api/blockchain/retry-transaction
 *
 * Retry a failed blockchain transaction
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserWalletAddress } from '@/lib/wallet-manager';
import {
  mintCopyrightNFT,
  mintLicenseNFT,
  createNFTMetadata,
  createLicenseNFTMetadata,
  createCertificateRecord,
  createLicenseRecord
} from '@/lib/blockchain-minting';
import { getPolygonscanUrl, getContractAddresses } from '@/lib/blockchain';

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { transactionId, payload } = body;

    if (!transactionId || !payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PARAMS',
          message: 'transactionId and payload are required'
        },
        { status: 400 }
      );
    }

    // Fetch the failed transaction record
    const { data: failedTx, error: fetchError } = await supabaseAdmin
      .from('failed_blockchain_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !failedTx) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Failed transaction not found'
        },
        { status: 404 }
      );
    }

    // Check if already resolved
    if (failedTx.retry_status === 'resolved') {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_RESOLVED',
          message: 'This transaction has already been resolved'
        },
        { status: 400 }
      );
    }

    // Check if abandoned
    if (failedTx.retry_status === 'abandoned') {
      return NextResponse.json(
        {
          success: false,
          error: 'ABANDONED',
          message: 'This transaction has been abandoned and cannot be retried'
        },
        { status: 400 }
      );
    }

    // Update status to retrying
    await supabaseAdmin
      .from('failed_blockchain_transactions')
      .update({
        retry_status: 'retrying',
        last_retry_at: new Date().toISOString(),
        retry_count: failedTx.retry_count + 1
      })
      .eq('id', transactionId);

    let mintResult;
    let dbRecord;
    let tableName;

    try {
      // Retry based on transaction type
      if (failedTx.transaction_type === 'copyright_certificate') {
        // Retry copyright certificate minting
        const {
          userId,
          workId,
          workTitle,
          workDescription,
          workHash,
          category,
          creatorName
        } = payload;

        // Get user wallet
        const walletInfo = await getUserWalletAddress(userId);
        if (!walletInfo) {
          throw new Error('User wallet not found');
        }

        // Create metadata
        const metadata = createNFTMetadata({
          workTitle,
          workDescription,
          workHash,
          category,
          creatorName,
          workId
        });

        // Mint NFT
        mintResult = await mintCopyrightNFT({
          recipientAddress: walletInfo.address,
          metadata,
          useMasterWallet: true
        });

        // Create database record
        dbRecord = createCertificateRecord({
          mintResult,
          metadata,
          userId,
          workId,
          walletAddress: walletInfo.address
        });

        tableName = 'copyright_certificates';
      } else if (failedTx.transaction_type === 'license') {
        // Retry license minting
        const {
          buyerUserId,
          workId,
          licenseOfferingId,
          orderId,
          licenseType,
          workTitle,
          creatorName,
          terms,
          expiryDate,
          usageLimit,
          priceBidr,
          transactionHash
        } = payload;

        // Get user wallet
        const walletInfo = await getUserWalletAddress(buyerUserId);
        if (!walletInfo) {
          throw new Error('Buyer wallet not found');
        }

        // Create metadata
        const metadata = createLicenseNFTMetadata({
          licenseType,
          workTitle,
          creatorName,
          terms,
          expiryDate: expiryDate || null,
          usageLimit: usageLimit !== null && usageLimit !== undefined ? usageLimit : null,
          purchaseAmount: priceBidr,
          orderId,
          licenseId: null
        });

        // Mint NFT
        mintResult = await mintLicenseNFT({
          recipientAddress: walletInfo.address,
          metadata,
          useMasterWallet: true
        });

        // Create database record
        const contractAddresses = getContractAddresses();
        dbRecord = createLicenseRecord({
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
          walletAddress: walletInfo.address,
          nftContractAddress: contractAddresses.LICENSE
        });

        tableName = 'licenses';
      } else {
        throw new Error('Unknown transaction type');
      }

      // Insert into appropriate table
      const { data: record, error: dbError } = await supabaseAdmin
        .from(tableName)
        .insert(dbRecord)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error after successful mint:', dbError);
        throw new Error(`Minting succeeded but database save failed: ${dbError.message}`);
      }

      // Mark as resolved
      await supabaseAdmin
        .from('failed_blockchain_transactions')
        .update({
          retry_status: 'resolved',
          resolved_at: new Date().toISOString(),
          successful_transaction_hash: mintResult.transactionHash,
          resolution_notes: 'Successfully retried and minted'
        })
        .eq('id', transactionId);

      return NextResponse.json({
        success: true,
        message: 'Transaction retried successfully',
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        polygonscanUrl: getPolygonscanUrl(mintResult.transactionHash, 'amoy'),
        recordId: record.id
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);

      // Update failed transaction with new error
      await supabaseAdmin
        .from('failed_blockchain_transactions')
        .update({
          retry_status: 'pending',
          error_message: `Retry failed: ${retryError.message}`,
          error_code: retryError.code || 'RETRY_FAILED'
        })
        .eq('id', transactionId);

      return NextResponse.json(
        {
          success: false,
          error: 'RETRY_FAILED',
          message: `Retry failed: ${retryError.message}`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in retry endpoint:', error);

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
