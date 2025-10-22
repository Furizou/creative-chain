import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://uaykbwwzqywkusmyxrbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheWtid3d6cXl3a3VzbXl4cmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTExNzU3NywiZXhwIjoyMDQ0NjkzNTc3fQ.ZOGLKvAeBh2G1Z8Kt2NKZxqkqTlr34Fk9vr_n8UY9O4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoData() {
  console.log('🚀 Starting demo data creation...');

  try {
    // 1. Create demo user profile
    console.log('📝 Creating demo user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: 'demo-user-id-12345',
        email: 'demo@creativechain.com',
        full_name: 'Demo Creator',
        username: 'democreator',
        user_type: 'creator',
        bio: 'I am a demo creator showcasing the CreativeChain platform with various digital artworks and creative content.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=democreator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
    } else {
      console.log('✅ Demo user profile created');
    }

    // 2. Create creative works
    console.log('🎨 Creating creative works...');
    const works = [
      {
        work_id: 'demo-work-1',
        creator_id: 'demo-user-id-12345',
        title: 'Digital Landscape Painting',
        description: 'A stunning digital painting of a futuristic landscape with vibrant colors and detailed architecture. Perfect for digital displays, presentations, or creative projects.',
        category: 'Digital Art',
        file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
        file_hash: 'hash_landscape_001',
        file_size: 2048000,
        metadata: { dimensions: "1920x1080", format: "PNG", style: "digital_art" },
        view_count: 187,
        download_count: 42,
        license_count: 2,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        work_id: 'demo-work-2',
        creator_id: 'demo-user-id-12345',
        title: 'Abstract Geometric Design',
        description: 'Modern abstract geometric design with bold shapes and color gradients. Ideal for branding, web design, or print materials.',
        category: 'Graphic Design',
        file_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        file_hash: 'hash_geometric_002',
        file_size: 1024000,
        metadata: { dimensions: "1080x1080", format: "SVG", style: "geometric" },
        view_count: 156,
        download_count: 38,
        license_count: 2,
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        work_id: 'demo-work-3',
        creator_id: 'demo-user-id-12345',
        title: 'Photography Collection',
        description: 'A curated collection of high-quality nature photography featuring landscapes, wildlife, and scenic views from around the world.',
        category: 'Photography',
        file_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        file_hash: 'hash_photography_003',
        file_size: 5120000,
        metadata: { dimensions: "4000x3000", format: "JPG", style: "nature" },
        view_count: 201,
        download_count: 67,
        license_count: 1,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        work_id: 'demo-work-4',
        creator_id: 'demo-user-id-12345',
        title: 'UI/UX Design Kit',
        description: 'Complete UI/UX design kit with modern components, icons, and layouts for web and mobile applications. Includes Figma source files.',
        category: 'UI/UX Design',
        file_url: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=600&fit=crop',
        file_hash: 'hash_uiux_004',
        file_size: 3072000,
        metadata: { dimensions: "1440x900", format: "FIGMA", style: "ui_kit" },
        view_count: 134,
        download_count: 29,
        license_count: 1,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: worksData, error: worksError } = await supabase
      .from('creative_works')
      .upsert(works, { onConflict: 'work_id' });

    if (worksError) {
      console.error('❌ Error creating works:', worksError);
    } else {
      console.log('✅ Creative works created');
    }

    // 3. Create license offerings
    console.log('💰 Creating license offerings...');
    const offerings = [
      // Digital Landscape Painting
      { offering_id: 'demo-offering-1-personal', work_id: 'demo-work-1', license_type: 'Personal', price_usd: 15.00, price_idr: 225000, description: 'Personal use license for individual projects', terms: 'For personal, non-commercial use only' },
      { offering_id: 'demo-offering-1-commercial', work_id: 'demo-work-1', license_type: 'Commercial', price_usd: 45.00, price_idr: 675000, description: 'Commercial license for business use', terms: 'For commercial use with attribution required' },
      { offering_id: 'demo-offering-1-exclusive', work_id: 'demo-work-1', license_type: 'Exclusive', price_usd: 150.00, price_idr: 2250000, description: 'Exclusive rights to the artwork', terms: 'Full exclusive rights with resale permissions' },
      // Abstract Geometric Design
      { offering_id: 'demo-offering-2-personal', work_id: 'demo-work-2', license_type: 'Personal', price_usd: 12.00, price_idr: 180000, description: 'Personal use license', terms: 'For personal, non-commercial use only' },
      { offering_id: 'demo-offering-2-commercial', work_id: 'demo-work-2', license_type: 'Commercial', price_usd: 35.00, price_idr: 525000, description: 'Commercial license', terms: 'For commercial use with attribution required' },
      // Photography Collection
      { offering_id: 'demo-offering-3-personal', work_id: 'demo-work-3', license_type: 'Personal', price_usd: 25.00, price_idr: 375000, description: 'Personal use for the photo collection', terms: 'For personal, non-commercial use only' },
      { offering_id: 'demo-offering-3-commercial', work_id: 'demo-work-3', license_type: 'Commercial', price_usd: 75.00, price_idr: 1125000, description: 'Commercial license for photos', terms: 'For commercial use with attribution required' },
      // UI/UX Design Kit
      { offering_id: 'demo-offering-4-personal', work_id: 'demo-work-4', license_type: 'Personal', price_usd: 20.00, price_idr: 300000, description: 'Personal use license for design kit', terms: 'For personal, non-commercial use only' },
      { offering_id: 'demo-offering-4-commercial', work_id: 'demo-work-4', license_type: 'Commercial', price_usd: 60.00, price_idr: 900000, description: 'Commercial license for design kit', terms: 'For commercial use with attribution required' }
    ];

    const { data: offeringsData, error: offeringsError } = await supabase
      .from('license_offerings')
      .upsert(offerings, { onConflict: 'offering_id' });

    if (offeringsError) {
      console.error('❌ Error creating offerings:', offeringsError);
    } else {
      console.log('✅ License offerings created');
    }

    // 4. Create license purchases
    console.log('🛍️ Creating license purchases...');
    const purchases = [
      { license_id: 'demo-license-1', work_id: 'demo-work-1', buyer_id: 'demo-buyer-1', license_type: 'Personal', purchase_price_usd: 15.00, purchase_price_idr: 225000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x1234567890abcdef', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { license_id: 'demo-license-2', work_id: 'demo-work-1', buyer_id: 'demo-buyer-2', license_type: 'Commercial', purchase_price_usd: 45.00, purchase_price_idr: 675000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x2345678901bcdef0', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { license_id: 'demo-license-3', work_id: 'demo-work-2', buyer_id: 'demo-buyer-3', license_type: 'Personal', purchase_price_usd: 12.00, purchase_price_idr: 180000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x3456789012cdef01', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { license_id: 'demo-license-4', work_id: 'demo-work-3', buyer_id: 'demo-buyer-4', license_type: 'Commercial', purchase_price_usd: 75.00, purchase_price_idr: 1125000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x4567890123def012', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { license_id: 'demo-license-5', work_id: 'demo-work-4', buyer_id: 'demo-buyer-5', license_type: 'Personal', purchase_price_usd: 20.00, purchase_price_idr: 300000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x5678901234ef0123', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { license_id: 'demo-license-6', work_id: 'demo-work-2', buyer_id: 'demo-buyer-6', license_type: 'Commercial', purchase_price_usd: 35.00, purchase_price_idr: 525000, payment_method: 'wallet', payment_status: 'completed', blockchain_hash: '0x6789012345f01234', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const { data: purchasesData, error: purchasesError } = await supabase
      .from('license_purchases')
      .upsert(purchases, { onConflict: 'license_id' });

    if (purchasesError) {
      console.error('❌ Error creating purchases:', purchasesError);
    } else {
      console.log('✅ License purchases created');
    }

    // 5. Create royalty splits
    console.log('📊 Creating royalty splits...');
    const splits = [
      { split_id: 'demo-split-1-creator', work_id: 'demo-work-1', recipient_id: 'demo-user-id-12345', percentage: 80.00 },
      { split_id: 'demo-split-1-platform', work_id: 'demo-work-1', recipient_id: 'platform', percentage: 20.00 },
      { split_id: 'demo-split-2-creator', work_id: 'demo-work-2', recipient_id: 'demo-user-id-12345', percentage: 80.00 },
      { split_id: 'demo-split-2-platform', work_id: 'demo-work-2', recipient_id: 'platform', percentage: 20.00 },
      { split_id: 'demo-split-3-creator', work_id: 'demo-work-3', recipient_id: 'demo-user-id-12345', percentage: 80.00 },
      { split_id: 'demo-split-3-platform', work_id: 'demo-work-3', recipient_id: 'platform', percentage: 20.00 },
      { split_id: 'demo-split-4-creator', work_id: 'demo-work-4', recipient_id: 'demo-user-id-12345', percentage: 80.00 },
      { split_id: 'demo-split-4-platform', work_id: 'demo-work-4', recipient_id: 'platform', percentage: 20.00 }
    ];

    const { data: splitsData, error: splitsError } = await supabase
      .from('royalty_splits')
      .upsert(splits, { onConflict: 'split_id' });

    if (splitsError) {
      console.error('❌ Error creating splits:', splitsError);
    } else {
      console.log('✅ Royalty splits created');
    }

    // 6. Create transaction ledger entries
    console.log('📋 Creating transaction ledger...');
    const transactions = [
      { ledger_id: 'demo-tx-1', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-1', to_user_id: 'demo-user-id-12345', amount_usd: 12.00, amount_idr: 180000, related_license_id: 'demo-license-1', blockchain_hash: '0x1234567890abcdef', status: 'completed', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { ledger_id: 'demo-tx-2', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-2', to_user_id: 'demo-user-id-12345', amount_usd: 36.00, amount_idr: 540000, related_license_id: 'demo-license-2', blockchain_hash: '0x2345678901bcdef0', status: 'completed', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { ledger_id: 'demo-tx-3', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-3', to_user_id: 'demo-user-id-12345', amount_usd: 9.60, amount_idr: 144000, related_license_id: 'demo-license-3', blockchain_hash: '0x3456789012cdef01', status: 'completed', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { ledger_id: 'demo-tx-4', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-4', to_user_id: 'demo-user-id-12345', amount_usd: 60.00, amount_idr: 900000, related_license_id: 'demo-license-4', blockchain_hash: '0x4567890123def012', status: 'completed', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { ledger_id: 'demo-tx-5', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-5', to_user_id: 'demo-user-id-12345', amount_usd: 16.00, amount_idr: 240000, related_license_id: 'demo-license-5', blockchain_hash: '0x5678901234ef0123', status: 'completed', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { ledger_id: 'demo-tx-6', transaction_type: 'license_purchase', from_user_id: 'demo-buyer-6', to_user_id: 'demo-user-id-12345', amount_usd: 28.00, amount_idr: 420000, related_license_id: 'demo-license-6', blockchain_hash: '0x6789012345f01234', status: 'completed', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transaction_ledger')
      .upsert(transactions, { onConflict: 'ledger_id' });

    if (transactionsError) {
      console.error('❌ Error creating transactions:', transactionsError);
    } else {
      console.log('✅ Transaction ledger created');
    }

    console.log('🎉 Demo data creation completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 1 Demo user created');
    console.log('   - 4 Creative works added');
    console.log('   - 9 License offerings created');
    console.log('   - 6 License purchases simulated');
    console.log('   - 8 Royalty splits configured');
    console.log('   - 6 Transaction ledger entries added');
    console.log('💰 Total demo earnings: ~Rp 2,424,000 (~$161.60)');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  }
}

// Run the function
createDemoData();