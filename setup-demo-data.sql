-- Create demo user and data for CreativeChain

-- First, let's create the demo user in auth.users
-- Note: This would typically be done through Supabase auth, but we'll create the profile

-- Insert demo user profile
INSERT INTO user_profiles (
  user_id,
  email,
  full_name,
  username,
  user_type,
  bio,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  'demo-user-id-12345',
  'demo@creativechain.com',
  'Demo Creator',
  'democreator',
  'creator',
  'I am a demo creator showcasing the CreativeChain platform with various digital artworks and creative content.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=democreator',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  updated_at = NOW();

-- Insert demo creative works
INSERT INTO creative_works (
  work_id,
  creator_id,
  title,
  description,
  category,
  file_url,
  file_hash,
  file_size,
  metadata,
  created_at,
  updated_at
) VALUES 
(
  'demo-work-1',
  'demo-user-id-12345',
  'Digital Landscape Painting',
  'A stunning digital painting of a futuristic landscape with vibrant colors and detailed architecture. Perfect for digital displays, presentations, or creative projects.',
  'Digital Art',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
  'hash_landscape_001',
  2048000,
  '{"dimensions": "1920x1080", "format": "PNG", "style": "digital_art"}',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
),
(
  'demo-work-2',
  'demo-user-id-12345',
  'Abstract Geometric Design',
  'Modern abstract geometric design with bold shapes and color gradients. Ideal for branding, web design, or print materials.',
  'Graphic Design',
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
  'hash_geometric_002',
  1024000,
  '{"dimensions": "1080x1080", "format": "SVG", "style": "geometric"}',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
),
(
  'demo-work-3',
  'demo-user-id-12345',
  'Photography Collection',
  'A curated collection of high-quality nature photography featuring landscapes, wildlife, and scenic views from around the world.',
  'Photography',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  'hash_photography_003',
  5120000,
  '{"dimensions": "4000x3000", "format": "JPG", "style": "nature"}',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
),
(
  'demo-work-4',
  'demo-user-id-12345',
  'UI/UX Design Kit',
  'Complete UI/UX design kit with modern components, icons, and layouts for web and mobile applications. Includes Figma source files.',
  'UI/UX Design',
  'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=600&fit=crop',
  'hash_uiux_004',
  3072000,
  '{"dimensions": "1440x900", "format": "FIGMA", "style": "ui_kit"}',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (work_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert license offerings for each work
INSERT INTO license_offerings (
  offering_id,
  work_id,
  license_type,
  price_usd,
  price_idr,
  description,
  terms,
  created_at
) VALUES 
-- For Digital Landscape Painting
('demo-offering-1-personal', 'demo-work-1', 'Personal', 15.00, 225000, 'Personal use license for individual projects', 'For personal, non-commercial use only', NOW() - INTERVAL '30 days'),
('demo-offering-1-commercial', 'demo-work-1', 'Commercial', 45.00, 675000, 'Commercial license for business use', 'For commercial use with attribution required', NOW() - INTERVAL '30 days'),
('demo-offering-1-exclusive', 'demo-work-1', 'Exclusive', 150.00, 2250000, 'Exclusive rights to the artwork', 'Full exclusive rights with resale permissions', NOW() - INTERVAL '30 days'),

-- For Abstract Geometric Design
('demo-offering-2-personal', 'demo-work-2', 'Personal', 12.00, 180000, 'Personal use license', 'For personal, non-commercial use only', NOW() - INTERVAL '25 days'),
('demo-offering-2-commercial', 'demo-work-2', 'Commercial', 35.00, 525000, 'Commercial license', 'For commercial use with attribution required', NOW() - INTERVAL '25 days'),

-- For Photography Collection
('demo-offering-3-personal', 'demo-work-3', 'Personal', 25.00, 375000, 'Personal use for the photo collection', 'For personal, non-commercial use only', NOW() - INTERVAL '20 days'),
('demo-offering-3-commercial', 'demo-work-3', 'Commercial', 75.00, 1125000, 'Commercial license for photos', 'For commercial use with attribution required', NOW() - INTERVAL '20 days'),

-- For UI/UX Design Kit
('demo-offering-4-personal', 'demo-work-4', 'Personal', 20.00, 300000, 'Personal use license for design kit', 'For personal, non-commercial use only', NOW() - INTERVAL '15 days'),
('demo-offering-4-commercial', 'demo-work-4', 'Commercial', 60.00, 900000, 'Commercial license for design kit', 'For commercial use with attribution required', NOW() - INTERVAL '15 days')
ON CONFLICT (offering_id) DO UPDATE SET
  price_usd = EXCLUDED.price_usd,
  price_idr = EXCLUDED.price_idr;

-- Insert some demo license purchases to show earnings data
INSERT INTO license_purchases (
  license_id,
  work_id,
  buyer_id,
  license_type,
  purchase_price_usd,
  purchase_price_idr,
  payment_method,
  payment_status,
  blockchain_hash,
  created_at
) VALUES 
('demo-license-1', 'demo-work-1', 'demo-buyer-1', 'Personal', 15.00, 225000, 'wallet', 'completed', '0x1234567890abcdef', NOW() - INTERVAL '10 days'),
('demo-license-2', 'demo-work-1', 'demo-buyer-2', 'Commercial', 45.00, 675000, 'wallet', 'completed', '0x2345678901bcdef0', NOW() - INTERVAL '8 days'),
('demo-license-3', 'demo-work-2', 'demo-buyer-3', 'Personal', 12.00, 180000, 'wallet', 'completed', '0x3456789012cdef01', NOW() - INTERVAL '6 days'),
('demo-license-4', 'demo-work-3', 'demo-buyer-4', 'Commercial', 75.00, 1125000, 'wallet', 'completed', '0x4567890123def012', NOW() - INTERVAL '4 days'),
('demo-license-5', 'demo-work-4', 'demo-buyer-5', 'Personal', 20.00, 300000, 'wallet', 'completed', '0x5678901234ef0123', NOW() - INTERVAL '2 days'),
('demo-license-6', 'demo-work-2', 'demo-buyer-6', 'Commercial', 35.00, 525000, 'wallet', 'completed', '0x6789012345f01234', NOW() - INTERVAL '1 day')
ON CONFLICT (license_id) DO NOTHING;

-- Insert royalty split configurations (demo creator gets 80%, platform gets 20%)
INSERT INTO royalty_splits (
  split_id,
  work_id,
  recipient_id,
  percentage,
  created_at
) VALUES 
('demo-split-1-creator', 'demo-work-1', 'demo-user-id-12345', 80.00, NOW() - INTERVAL '30 days'),
('demo-split-1-platform', 'demo-work-1', 'platform', 20.00, NOW() - INTERVAL '30 days'),
('demo-split-2-creator', 'demo-work-2', 'demo-user-id-12345', 80.00, NOW() - INTERVAL '25 days'),
('demo-split-2-platform', 'demo-work-2', 'platform', 20.00, NOW() - INTERVAL '25 days'),
('demo-split-3-creator', 'demo-work-3', 'demo-user-id-12345', 80.00, NOW() - INTERVAL '20 days'),
('demo-split-3-platform', 'demo-work-3', 'platform', 20.00, NOW() - INTERVAL '20 days'),
('demo-split-4-creator', 'demo-work-4', 'demo-user-id-12345', 80.00, NOW() - INTERVAL '15 days'),
('demo-split-4-platform', 'demo-work-4', 'platform', 20.00, NOW() - INTERVAL '15 days')
ON CONFLICT (split_id) DO NOTHING;

-- Insert transaction ledger entries
INSERT INTO transaction_ledger (
  ledger_id,
  transaction_type,
  from_user_id,
  to_user_id,
  amount_usd,
  amount_idr,
  related_license_id,
  blockchain_hash,
  status,
  created_at
) VALUES 
('demo-tx-1', 'license_purchase', 'demo-buyer-1', 'demo-user-id-12345', 12.00, 180000, 'demo-license-1', '0x1234567890abcdef', 'completed', NOW() - INTERVAL '10 days'),
('demo-tx-2', 'license_purchase', 'demo-buyer-2', 'demo-user-id-12345', 36.00, 540000, 'demo-license-2', '0x2345678901bcdef0', 'completed', NOW() - INTERVAL '8 days'),
('demo-tx-3', 'license_purchase', 'demo-buyer-3', 'demo-user-id-12345', 9.60, 144000, 'demo-license-3', '0x3456789012cdef01', 'completed', NOW() - INTERVAL '6 days'),
('demo-tx-4', 'license_purchase', 'demo-buyer-4', 'demo-user-id-12345', 60.00, 900000, 'demo-license-4', '0x4567890123def012', 'completed', NOW() - INTERVAL '4 days'),
('demo-tx-5', 'license_purchase', 'demo-buyer-5', 'demo-user-id-12345', 16.00, 240000, 'demo-license-5', '0x5678901234ef0123', 'completed', NOW() - INTERVAL '2 days'),
('demo-tx-6', 'license_purchase', 'demo-buyer-6', 'demo-user-id-12345', 28.00, 420000, 'demo-license-6', '0x6789012345f01234', 'completed', NOW() - INTERVAL '1 day')
ON CONFLICT (ledger_id) DO NOTHING;

-- Update view counts and download counts to show activity
UPDATE creative_works SET 
  view_count = 150 + (RANDOM() * 100)::INT,
  download_count = 25 + (RANDOM() * 50)::INT,
  license_count = (
    SELECT COUNT(*) FROM license_purchases 
    WHERE license_purchases.work_id = creative_works.work_id
  )
WHERE creator_id = 'demo-user-id-12345';

-- Summary: This script creates:
-- 1. Demo user profile (democreator)
-- 2. 4 creative works with different categories
-- 3. License offerings for each work (Personal, Commercial, some Exclusive)
-- 4. 6 license purchases showing revenue history
-- 5. Royalty splits (80% creator, 20% platform)
-- 6. Transaction ledger entries for earnings tracking
-- 7. Realistic view and download counts

COMMIT;