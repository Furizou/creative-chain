/**
 * Browser Console Script to Create Demo Data
 * 
 * Instructions:
 * 1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/uaykbwwzqywkusmyxrbc
 * 2. Navigate to SQL Editor
 * 3. Copy and paste this SQL script and run it
 */

-- Step 1: Create demo user in auth.users (do this manually through Supabase Auth dashboard)
-- Email: demo@creativechain.com
-- Password: Demo123!

-- Step 2: Get the user_id from auth.users and replace 'REPLACE_WITH_ACTUAL_USER_ID' below

-- Step 3: Run this SQL script:

BEGIN;

-- Clean up existing demo data first
DELETE FROM royalty_splits WHERE id::text LIKE 'demo-%';
DELETE FROM licenses WHERE id::text LIKE 'demo-%';
DELETE FROM license_offerings WHERE id::text LIKE 'demo-%';
DELETE FROM creative_works WHERE id::text LIKE 'demo-%';
DELETE FROM profiles WHERE username = 'democreator';

-- Insert demo user profile (replace the user_id with actual one from auth.users)
-- First, delete existing democreator if exists
-- DELETE FROM profiles WHERE username = 'democreator';

INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_ACTUAL_USER_ID',
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
  'demo-work-1',
  'REPLACE_WITH_ACTUAL_USER_ID',
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
  'demo-work-2',
  'REPLACE_WITH_ACTUAL_USER_ID',
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
  'demo-work-3',
  'REPLACE_WITH_ACTUAL_USER_ID',
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
  'demo-work-4',
  'REPLACE_WITH_ACTUAL_USER_ID',
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
('demo-offering-1-personal', 'demo-work-1', 'Personal', 'Personal License', 'Personal use license', 225000, 225, 'For personal, non-commercial use only', NOW() - INTERVAL '30 days'),
('demo-offering-1-commercial', 'demo-work-1', 'Commercial', 'Commercial License', 'Commercial license', 675000, 675, 'For commercial use with attribution required', NOW() - INTERVAL '30 days'),
('demo-offering-1-exclusive', 'demo-work-1', 'Exclusive', 'Exclusive License', 'Exclusive rights', 2250000, 2250, 'Full exclusive rights with resale permissions', NOW() - INTERVAL '30 days'),

-- Abstract Geometric Design
('demo-offering-2-personal', 'demo-work-2', 'Personal', 'Personal License', 'Personal use license', 180000, 180, 'For personal, non-commercial use only', NOW() - INTERVAL '25 days'),
('demo-offering-2-commercial', 'demo-work-2', 'Commercial', 'Commercial License', 'Commercial license', 525000, 525, 'For commercial use with attribution required', NOW() - INTERVAL '25 days'),

-- Photography Collection
('demo-offering-3-personal', 'demo-work-3', 'Personal', 'Personal License', 'Personal use license', 375000, 375, 'For personal, non-commercial use only', NOW() - INTERVAL '20 days'),
('demo-offering-3-commercial', 'demo-work-3', 'Commercial', 'Commercial License', 'Commercial license', 1125000, 1125, 'For commercial use with attribution required', NOW() - INTERVAL '20 days'),

-- UI/UX Design Kit
('demo-offering-4-personal', 'demo-work-4', 'Personal', 'Personal License', 'Personal use license', 300000, 300, 'For personal, non-commercial use only', NOW() - INTERVAL '15 days'),
('demo-offering-4-commercial', 'demo-work-4', 'Commercial', 'Commercial License', 'Commercial license', 900000, 900, 'For commercial use with attribution required', NOW() - INTERVAL '15 days')
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
('demo-license-1', 'demo-work-1', 'REPLACE_WITH_ACTUAL_USER_ID', 'Personal', 225, '0x1234567890abcdef', NOW() - INTERVAL '10 days', 'demo-offering-1-personal', 'nft_001', '0xdemo1'),
('demo-license-2', 'demo-work-1', 'REPLACE_WITH_ACTUAL_USER_ID', 'Commercial', 675, '0x2345678901bcdef0', NOW() - INTERVAL '8 days', 'demo-offering-1-commercial', 'nft_002', '0xdemo2'),
('demo-license-3', 'demo-work-2', 'REPLACE_WITH_ACTUAL_USER_ID', 'Personal', 180, '0x3456789012cdef01', NOW() - INTERVAL '6 days', 'demo-offering-2-personal', 'nft_003', '0xdemo3'),
('demo-license-4', 'demo-work-3', 'REPLACE_WITH_ACTUAL_USER_ID', 'Commercial', 1125, '0x4567890123def012', NOW() - INTERVAL '4 days', 'demo-offering-3-commercial', 'nft_004', '0xdemo4'),
('demo-license-5', 'demo-work-4', 'REPLACE_WITH_ACTUAL_USER_ID', 'Personal', 300, '0x5678901234ef0123', NOW() - INTERVAL '2 days', 'demo-offering-4-personal', 'nft_005', '0xdemo5'),
('demo-license-6', 'demo-work-2', 'REPLACE_WITH_ACTUAL_USER_ID', 'Commercial', 525, '0x6789012345f01234', NOW() - INTERVAL '1 day', 'demo-offering-2-commercial', 'nft_006', '0xdemo6')
ON CONFLICT (id) DO NOTHING;

-- Insert royalty splits (80% creator, 20% platform)
INSERT INTO royalty_splits (
  id,
  work_id,
  recipient_address,
  split_percentage,
  created_at
) VALUES 
('demo-split-1-creator', 'demo-work-1', '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '30 days'),
('demo-split-1-platform', 'demo-work-1', '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '30 days'),
('demo-split-2-creator', 'demo-work-2', '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '25 days'),
('demo-split-2-platform', 'demo-work-2', '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '25 days'),
('demo-split-3-creator', 'demo-work-3', '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '20 days'),
('demo-split-3-platform', 'demo-work-3', '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '20 days'),
('demo-split-4-creator', 'demo-work-4', '0xCREATOR_ADDRESS_1', 80.00, NOW() - INTERVAL '15 days'),
('demo-split-4-platform', 'demo-work-4', '0xPLATFORM_ADDRESS', 20.00, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Summary of what this creates:
-- 📊 Total Revenue: 3,030 BIDR / Rp 3,030,000
-- 💰 Creator Earnings (80%): 2,424 BIDR / Rp 2,424,000  
-- 🏢 Platform Fee (20%): 606 BIDR / Rp 606,000
-- 📈 6 License Sales across 4 Creative Works
-- 🎨 4 Creative Works with different categories
-- 💳 9 License Offerings (Personal, Commercial, Exclusive)

-- Next steps:
-- 1. Create the demo user in Supabase Auth with email: demo@creativechain.com
-- 2. Replace 'REPLACE_WITH_ACTUAL_USER_ID' with the real user ID
-- 3. Run this script in Supabase SQL Editor
-- 4. Test the login with the demo user credentials