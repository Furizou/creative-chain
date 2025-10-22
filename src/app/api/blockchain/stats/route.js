/**
 * GET /api/blockchain/stats
 *
 * Get blockchain statistics for copyright and license NFTs
 */

import { NextResponse } from 'next/server';
import { getTotalSupply, getLicenseTotalSupply } from '@/lib/blockchain-minting';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'copyright' or 'license'

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_TYPE',
          message: 'Type parameter is required (copyright or license)'
        },
        { status: 400 }
      );
    }

    let totalSupply = 0;

    try {
      if (type === 'copyright') {
        totalSupply = await getTotalSupply();
      } else if (type === 'license') {
        totalSupply = await getLicenseTotalSupply();
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_TYPE',
            message: 'Type must be either "copyright" or "license"'
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        type,
        totalSupply,
        timestamp: new Date().toISOString()
      });
    } catch (blockchainError) {
      console.error(`Error fetching ${type} total supply:`, blockchainError);

      return NextResponse.json(
        {
          success: false,
          error: 'BLOCKCHAIN_ERROR',
          message: `Failed to fetch blockchain stats: ${blockchainError.message}`,
          totalSupply: 0
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in blockchain stats endpoint:', error);

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
