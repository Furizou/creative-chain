import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request) {
  try {
    // 1. Get authenticated session using auth-helpers
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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