--
-- Manual Seed Data for CreativeChain Demo
-- Run this ONLY AFTER creating real users through Supabase Auth
--

-- Instructions:
-- 1. First create users through the signup process in your app
-- 2. Get the actual user IDs from auth.users table
-- 3. Replace the UUIDs below with real user IDs
-- 4. Then run this script

-- STEP 1: Check existing users (run this query first to get real user IDs)
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- STEP 2: Replace these placeholder UUIDs with real user IDs from auth.users
-- Example real user IDs (replace these):
-- User 1: replace '00000000-0000-0000-0000-000000000001' with real UUID from auth.users
-- User 2: replace '00000000-0000-0000-0000-000000000002' with real UUID from auth.users  
-- User 3: replace '00000000-0000-0000-0000-000000000003' with real UUID from auth.users

-- STEP 3: Manually insert profiles for existing users
-- INSERT INTO public.profiles (id, username, full_name, wallet_address) VALUES
-- ('REPLACE_WITH_REAL_USER_ID_1', 'john_artist', 'John Artist', '0x1234567890123456789012345678901234567890'),
-- ('REPLACE_WITH_REAL_USER_ID_2', 'jane_creator', 'Jane Creator', '0x2345678901234567890123456789012345678901'),
-- ('REPLACE_WITH_REAL_USER_ID_3', 'mike_music', 'Mike Music', '0x3456789012345678901234567890123456789012');

-- STEP 4: Insert sample creative works (using real user IDs)
-- INSERT INTO public.creative_works (id, creator_id, title, description, category, file_url, file_hash, nft_token_id, nft_tx_hash) VALUES
-- ('10000000-0000-0000-0000-000000000001', 'REPLACE_WITH_REAL_USER_ID_1', 'Abstract Digital Art #1', 'A vibrant abstract digital composition', 'Digital Art', 'https://placeholder.storage/art1.jpg', 'hash1234567890abcdef', '1', '0xabc123def456'),
-- ('10000000-0000-0000-0000-000000000002', 'REPLACE_WITH_REAL_USER_ID_2', 'Urban Photography Series', 'Street photography capturing city life', 'Photography', 'https://placeholder.storage/photo1.jpg', 'hash2345678901bcdefg', '2', '0xdef456ghi789'),
-- ('10000000-0000-0000-0000-000000000003', 'REPLACE_WITH_REAL_USER_ID_3', 'Electronic Beat Track', 'Upbeat electronic music for commercial use', 'Music', 'https://placeholder.storage/music1.mp3', 'hash3456789012cdefgh', '3', '0xghi789jkl012');

-- STEP 5: Insert other sample data as needed
-- (royalty_splits, licenses, analytics_events using the real work IDs and user IDs)

-- For now, this is just a template. The actual seeding should be done through:
-- 1. The application interface (users sign up and upload works)
-- 2. API endpoints that create data properly
-- 3. Manual insertion after getting real user IDs from auth.users table