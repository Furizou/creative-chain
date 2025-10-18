/**
 * @fileoverview Creative Works Upload API Route
 * Handles POST requests to upload creative works with file storage and database insertion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * POST /api/creative-works/upload
 * Uploads a creative work file and saves metadata to database
 * 
 * @param {NextRequest} request - The incoming request with multipart/form-data
 * @returns {NextResponse} JSON response with upload result
 */
export async function POST(request) {
  try {
    // 1. Secure the Route: Get authenticated user session with development fallback
    const DEMO_CREATOR_ID = 'ec452ac9-87d2-4df9-8f2d-c8efae09d5ab';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // First, always try to get a real session
    const { data: { session } } = await supabase.auth.getSession();

    let userId;

    if (session && session.user) {
      // 1. If a real session exists, use it.
      userId = session.user.id;
      console.log(`Authenticated with real user session: ${userId}`);
    } else if (process.env.NODE_ENV === 'development') {
      // 2. If no session, but we are in development, use the mock ID as a fallback.
      userId = DEMO_CREATOR_ID;
      console.warn('⚠️ NO REAL SESSION: Using mock creator ID for upload as a fallback.');
    } else {
      // 3. If no session and we are in production, it's an error.
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required', success: false },
        { status: 401 }
      );
    }

    // Apply Principle of Least Privilege: Choose appropriate client based on authentication method
    let operationClient;

    if (session && session.user) {
      // Real user session: Use standard authenticated client (follows RLS)
      operationClient = supabase;
      console.log('Using authenticated user client (RLS enforced)');
    } else {
      // Development fallback with mock user: Use service role client (bypasses RLS)
      operationClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('Using service role client for development fallback (RLS bypassed)');
    }

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
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `public/${userId}/${fileName}`;

    // Get file buffer for upload and hash generation
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to creative-works bucket
    const { data: uploadData, error: uploadError } = await operationClient.storage
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
    const { data: urlData } = operationClient.storage
      .from('creative-works')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // 4. Generate File Hash: Create SHA-256 hash of file contents
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // 5. Save to Database: Insert record into creative_works table
    const { data: workData, error: insertError } = await operationClient
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
      await operationClient.storage
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

    // 6. Add Minting Placeholder
    // TODO: Trigger certificate minting process

    console.log(`Creative work ${workData.id} uploaded successfully by user ${userId}`);

    // 7. Return Success Response
    return NextResponse.json(
      {
        success: true,
        message: 'Creative work uploaded successfully',
        id: workData.id,
        file_url: fileUrl,
        file_hash: fileHash
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