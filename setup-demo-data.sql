-- Create demo user and data for CreativeChain

-- First, let's create the demo user in auth.users
-- Note: This would typically be done through Supabase auth, but we'll create the profile

BEGIN;

-- Insert demo user profile (replace the user_id with actual one from auth.users)
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2',
  'democreator',
  'Demo Creator',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=democreator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Insert demo creative works
INSERT INTO creative_works (
  id,
  creator_id,
  title,
  description,
  category,
  file_url,
  file_hash,
  file_size,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2',
  'Digital Landscape Painting',
  'A stunning digital painting of a futuristic landscape with vibrant colors and detailed architecture.',
  'Digital Art',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
  'hash_landscape_001',
  2048000,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2',
  'Abstract Geometric Design',
  'Modern abstract geometric design with bold shapes and color gradients.',
  'Graphic Design',
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
  'hash_geometric_002',
  1024000,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2',
  'Photography Collection',
  'A curated collection of high-quality nature photography.',
  'Photography',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  'hash_photography_003',
  5120000,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2',
  'UI/UX Design Kit',
  'Complete UI/UX design kit with modern components and layouts.',
  'UI/UX Design',
  'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=600&fit=crop',
  'hash_uiux_004',
  3072000,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert license offerings
INSERT INTO license_offerings (
  id,
  work_id,
  license_type,
  title,
  description,
  price_idr,
  price_bidr,
  terms,
  created_at
) VALUES 
-- Digital Landscape Painting
('aaaa1111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Personal', 'Personal License', 'Personal use license', 225000, 225, 'For personal, non-commercial use only', NOW() - INTERVAL '30 days'),
('aaaa1111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Commercial', 'Commercial License', 'Commercial license', 675000, 675, 'For commercial use with attribution required', NOW() - INTERVAL '30 days'),
('aaaa1111-1111-1111-1111-111111111113'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Exclusive', 'Exclusive License', 'Exclusive rights', 2250000, 2250, 'Full exclusive rights with resale permissions', NOW() - INTERVAL '30 days'),

-- Abstract Geometric Design
('bbbb2222-2222-2222-2222-222222222221'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Personal', 'Personal License', 'Personal use license', 180000, 180, 'For personal, non-commercial use only', NOW() - INTERVAL '25 days'),
('bbbb2222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Commercial', 'Commercial License', 'Commercial license', 525000, 525, 'For commercial use with attribution required', NOW() - INTERVAL '25 days'),

-- Photography Collection
('cccc3333-3333-3333-3333-333333333331'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Personal', 'Personal License', 'Personal use license', 375000, 375, 'For personal, non-commercial use only', NOW() - INTERVAL '20 days'),
('cccc3333-3333-3333-3333-333333333332'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Commercial', 'Commercial License', 'Commercial license', 1125000, 1125, 'For commercial use with attribution required', NOW() - INTERVAL '20 days'),

-- UI/UX Design Kit
('dddd4444-4444-4444-4444-444444444441'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Personal', 'Personal License', 'Personal use license', 300000, 300, 'For personal, non-commercial use only', NOW() - INTERVAL '15 days'),
('dddd4444-4444-4444-4444-444444444442'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Commercial', 'Commercial License', 'Commercial license', 900000, 900, 'For commercial use with attribution required', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO UPDATE SET
  price_idr = EXCLUDED.price_idr,
  price_bidr = EXCLUDED.price_bidr;

-- Insert demo license purchases
INSERT INTO licenses (
  id,
  work_id,
  buyer_id,
  license_type,
  price_bidr,
  transaction_hash,
  purchased_at,
  license_offering_id,
  nft_token_id,
  wallet_address
) VALUES 
('eeee1111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Personal', 225, '0x1234567890abcdef', NOW() - INTERVAL '10 days', 'aaaa1111-1111-1111-1111-111111111111'::uuid, 'nft_001', '0xdemo1'),
('eeee1111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Commercial', 675, '0x2345678901bcdef0', NOW() - INTERVAL '8 days', 'aaaa1111-1111-1111-1111-111111111112'::uuid, 'nft_002', '0xdemo2'),
('eeee2222-2222-2222-2222-222222222221'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Personal', 180, '0x3456789012cdef01', NOW() - INTERVAL '6 days', 'bbbb2222-2222-2222-2222-222222222221'::uuid, 'nft_003', '0xdemo3'),
('eeee3333-3333-3333-3333-333333333331'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Commercial', 1125, '0x4567890123def012', NOW() - INTERVAL '4 days', 'cccc3333-3333-3333-3333-333333333332'::uuid, 'nft_004', '0xdemo4'),
('eeee4444-4444-4444-4444-444444444441'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Personal', 300, '0x5678901234ef0123', NOW() - INTERVAL '2 days', 'dddd4444-4444-4444-4444-444444444441'::uuid, 'nft_005', '0xdemo5'),
('eeee2222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2', 'Commercial', 525, '0x6789012345f01234', NOW() - INTERVAL '1 day', 'bbbb2222-2222-2222-2222-222222222222'::uuid, 'nft_006', '0xdemo6')
ON CONFLICT (id) DO NOTHING;

-- Insert royalty splits (80% creator, 20% platform)
INSERT INTO royalty_splits (
  id,
  work_id,
  recipient_address,
  split_percentage,
  created_at
) VALUES 
('ffff1111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '30 days'),
('ffff1111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '30 days'),
('ffff2222-2222-2222-2222-222222222221'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '25 days'),
('ffff2222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '25 days'),
('ffff3333-3333-3333-3333-333333333331'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '20 days'),
('ffff3333-3333-3333-3333-333333333332'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '20 days'),
('ffff4444-4444-4444-4444-444444444441'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '15 days'),
('ffff4444-4444-4444-4444-444444444442'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Summary of what this creates:
-- 📊 Total Revenue: 3,030 BIDR / Rp 3,030,000
-- 💰 Creator Earnings (80%): 2,424 BIDR / Rp 2,424,000  
-- 🏢 Platform Fee (20%): 606 BIDR / Rp 606,000
-- 📈 6 License Sales across 4 Creative Works
-- 🎨 4 Creative Works with different categories
-- 💳 9 License Offerings (Personal, Commercial, Exclusive)

-- Instructions:
-- 1. Create the demo user in Supabase Auth with email: demo@creativechain.com / Demo123!
-- 2. Replace '2ea2120d-fbe7-4ff7-acf3-cae1694b33f2' with the actual user ID from auth.users
-- 3. Run this script in Supabase SQL Editor
-- 4. Test the login and check the enhanced dashboard