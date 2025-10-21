import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getUserWalletAddress } from '@/lib/wallet-manager';
import {
  createNFTMetadata,
  mintCopyrightNFT,
  createCertificateRecord
} from '@/lib/blockchain-minting';

export async function POST(request) {
  try {
    // 1. Get authenticated session
    const supabase = await createServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session retrieval error:', sessionError);
      return NextResponse.json(
        { error: 'Session error', success: false },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      console.error('Unauthorized upload attempt: No authenticated session');
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required', success: false },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`Authenticated upload from user: ${userId}`);

    // 2. Create admin client for database operations
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

    // 2. Parse Form Data: Read multipart/form-data
    const formData = await request.formData();
    
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');

    // Validate required fields
    if (!file || !title || !description || !category) {
      return NextResponse.json(
        {
          error: 'Missing required fields: file, title, description, or category',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate file is actually a file
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'Invalid file upload',
          success: false
        },
        { status: 400 }
      );
    }

    // 3. Upload to Supabase Storage
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    
    // Sanitize filename - remove special characters
    const sanitizedName = file.name
      .replace(/[^\w.-]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = `public/${userId}/${fileName}`;

    // Get file buffer for upload and hash generation
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to creative-works bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('creative-works')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        {
          error: `File upload failed: ${uploadError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    // Get public URL of the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from('creative-works')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // 4. Generate File Hash: Create SHA-256 hash of file contents
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // 5. Save to Database: Insert record into creative_works table
    const { data: workData, error: insertError } = await supabaseAdmin
      .from('creative_works')
      .insert({
        creator_id: userId,
        title: title.toString(),
        description: description.toString(),
        category: category.toString(),
        file_url: fileUrl,
        file_hash: fileHash,
        original_filename: file.name,
        file_size: file.size
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('creative-works')
        .remove([filePath]);

      return NextResponse.json(
        {
          error: `Database save failed: ${insertError.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    // 6. Mint Copyright NFT Certificate
    let certificateResult = null;
    let mintingError = null;

    try {
      // Get user profile for creator name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single();

      const creatorName = profile?.full_name || profile?.username || 'Anonymous';

      console.log(`Starting copyright certificate minting for work ${workData.id}`);

      // Get user's wallet address
      const walletInfo = await getUserWalletAddress(userId);

      if (!walletInfo) {
        throw new Error('User does not have a custodial wallet');
      }

      const walletAddress = walletInfo.address;
      console.log(`Minting certificate to wallet: ${walletAddress}`);

      // Create NFT metadata
      const metadata = createNFTMetadata({
        workTitle: title.toString(),
        workDescription: description.toString(),
        workHash: fileHash,
        category: category.toString().toLowerCase(),
        creatorName,
        workId: workData.id
      });

      console.log('Created NFT metadata:', JSON.stringify(metadata, null, 2));

      // Mint copyright NFT
      const mintResult = await mintCopyrightNFT({
        recipientAddress: walletAddress,
        metadata,
        useMasterWallet: true
      });

      console.log('Minting successful:', mintResult);

      // Create certificate record
      const certificateRecord = createCertificateRecord({
        mintResult,
        metadata,
        userId,
        workId: workData.id,
        walletAddress
      });

      // Save certificate to database
      const { data: certificate, error: certError } = await supabaseAdmin
        .from('copyright_certificates')
        .insert(certificateRecord)
        .select()
        .single();

      if (certError) {
        console.error('Certificate database save error:', certError);
        throw new Error(`Failed to save certificate: ${certError.message}`);
      }

      console.log(`Certificate ${certificate.id} saved successfully`);

      // Update creative_works table with NFT info
      const { error: updateError } = await supabaseAdmin
        .from('creative_works')
        .update({
          nft_token_id: mintResult.tokenId,
          nft_tx_hash: mintResult.transactionHash
        })
        .eq('id', workData.id);

      if (updateError) {
        console.error('Failed to update creative_works with NFT data:', updateError);
      }

      certificateResult = {
        certificateId: certificate.id,
        tokenId: certificate.token_id,
        transactionHash: certificate.transaction_hash,
        polygonscanUrl: certificate.polygonscan_url
      };

    } catch (error) {
      mintingError = error.message;
      console.error('Error during certificate minting:', error);
    }

    console.log(`Creative work ${workData.id} uploaded successfully by user ${userId}`);

    // 7. Return Success Response
    return NextResponse.json(
      {
        success: true,
        message: 'Creative work uploaded successfully',
        id: workData.id,
        file_url: fileUrl,
        file_hash: fileHash,
        certificate: certificateResult ? {
          tokenId: certificateResult.tokenId,
          transactionHash: certificateResult.transactionHash,
          polygonscanUrl: certificateResult.polygonscanUrl
        } : null,
        mintingError: mintingError
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in creative works upload:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error during upload',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to upload creative works.',
      success: false 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to upload creative works.',
      success: false 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to upload creative works.',
      success: false 
    },
    { status: 405 }
  );
}