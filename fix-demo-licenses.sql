-- Fix demo data by adding proper license purchases
-- This script adds the missing licenses that should have been created

BEGIN;

-- No need to create new profiles - using existing users as buyers:
-- demobuyer: bc68b7b4-9435-4cf0-a72a-a7a3b339a56b
-- test: 1a71cba8-df99-4c14-89d3-677c6ae94cf7  
-- test_user: 9824cf9a-a73b-4c5c-a00c-499d2912e1c6

-- Insert the missing license purchases with existing user references
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
-- License purchases with existing users as buyers
('eeee1111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'bc68b7b4-9435-4cf0-a72a-a7a3b339a56b'::uuid, 'Personal', 225, '0x1234567890abcdef', NOW() - INTERVAL '10 days', 'aaaa1111-1111-1111-1111-111111111111'::uuid, 'nft_001', '0xdemobuyer'),
('eeee1111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '1a71cba8-df99-4c14-89d3-677c6ae94cf7'::uuid, 'Commercial', 675, '0x2345678901bcdef0', NOW() - INTERVAL '8 days', 'aaaa1111-1111-1111-1111-111111111112'::uuid, 'nft_002', '0xtest'),
('eeee2222-2222-2222-2222-222222222221'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '9824cf9a-a73b-4c5c-a00c-499d2912e1c6'::uuid, 'Personal', 180, '0x3456789012cdef01', NOW() - INTERVAL '6 days', 'bbbb2222-2222-2222-2222-222222222221'::uuid, 'nft_003', '0xtestuser'),
('eeee3333-3333-3333-3333-333333333331'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'bc68b7b4-9435-4cf0-a72a-a7a3b339a56b'::uuid, 'Commercial', 1125, '0x4567890123def012', NOW() - INTERVAL '4 days', 'cccc3333-3333-3333-3333-333333333332'::uuid, 'nft_004', '0xdemobuyer'),
('eeee4444-4444-4444-4444-444444444441'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '1a71cba8-df99-4c14-89d3-677c6ae94cf7'::uuid, 'Personal', 300, '0x5678901234ef0123', NOW() - INTERVAL '2 days', 'dddd4444-4444-4444-4444-444444444441'::uuid, 'nft_005', '0xtest'),
('eeee2222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '9824cf9a-a73b-4c5c-a00c-499d2912e1c6'::uuid, 'Commercial', 525, '0x6789012345f01234', NOW() - INTERVAL '1 day', 'bbbb2222-2222-2222-2222-222222222222'::uuid, 'nft_006', '0xtestuser')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Summary: This adds 6 license purchases for a total of 3,030 BIDR revenue
-- 📊 Total Revenue: 3,030 BIDR (225 + 675 + 180 + 1125 + 300 + 525)
-- 💰 Creator Earnings (80%): 2,424 BIDR  
-- 🏢 Platform Fee (20%): 606 BIDR
-- 📈 6 License Sales across 4 Creative Works