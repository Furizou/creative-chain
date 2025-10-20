'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to create a demo license offering for testing purposes
 * @param {string} workId - The ID of the creative work
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createDemoLicenseOffering(workId) {
  try {
    // Validate input
    if (!workId) {
      return {
        success: false,
        error: 'Work ID is required'
      };
    }

    // Create Supabase admin client with service role key
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

    // Insert new demo license offering with randomized properties
    const licenseTypes = ['standard', 'commercial', 'exclusive', 'editorial', 'extended'];
    const randomLicenseType = licenseTypes[Math.floor(Math.random() * licenseTypes.length)];
    
    const basePrice = Math.floor(Math.random() * 200000) + 25000; // Random price between 25,000 and 225,000 IDR
    const titles = [
      'Demo Standard License',
      'Commercial Use License', 
      'Extended Rights License',
      'Editorial Usage License',
      'Premium License Package',
      'Creative Commons License',
      'Royalty-Free License'
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    const descriptions = [
      'A temporary, non-exclusive license created for testing purposes.',
      'Perfect for commercial projects and marketing materials.',
      'Comprehensive license with extended usage rights.',
      'Ideal for editorial and journalistic content.',
      'Premium license with maximum flexibility.',
      'Creative commons style license for open usage.',
      'Royalty-free license for unlimited usage.'
    ];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    const { data, error } = await supabaseAdmin
      .from('license_offerings')
      .insert({
        work_id: workId,
        license_type: randomLicenseType,
        title: randomTitle,
        description: randomDescription,
        price_idr: basePrice,
        price_bidr: basePrice
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating demo license offering:', error);
      return {
        success: false,
        error: `Failed to create demo license: ${error.message}`
      };
    }

    // Revalidate the work detail page to refresh the data
    revalidatePath(`/works/${workId}`);

    console.log(`Demo license offering created for work ${workId}:`, data.id);

    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('Unexpected error in createDemoLicenseOffering:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the demo license'
    };
  }
}