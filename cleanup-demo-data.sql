/**
 * Cleanup Script to Remove Demo Data
 * 
 * Instructions:
 * 1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/uaykbwwzqywkusmyxrbc
 * 2. Navigate to SQL Editor
 * 3. Copy and paste this cleanup script and run it
 */

BEGIN;

-- Remove demo data in correct order (to avoid foreign key conflicts)
-- Step 1: Delete royalty splits first (no dependencies)
DELETE FROM royalty_splits WHERE id::text LIKE 'demo-%';

-- Step 2: Get demo user ID for reference
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get demo user ID
    SELECT id INTO demo_user_id FROM profiles WHERE username = 'democreator';
    
    -- If demo user exists, proceed with cleanup
    IF demo_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found demo user: %', demo_user_id;
        
        -- First, delete ALL licenses that could reference demo data
        DELETE FROM licenses WHERE 
            id::text LIKE 'demo-%' 
            OR buyer_id = demo_user_id
            OR work_id IN (
                SELECT id FROM creative_works 
                WHERE id::text LIKE 'demo-%' OR creator_id = demo_user_id
            )
            OR license_offering_id IN (
                SELECT id FROM license_offerings WHERE id::text LIKE 'demo-%'
            );
        
        RAISE NOTICE 'Deleted demo licenses';
        
        -- Delete ALL orders that reference demo license offerings (more comprehensive)
        DELETE FROM orders WHERE 
            id::text LIKE 'demo-%'
            OR buyer_id = demo_user_id
            OR license_offering_id IN (
                SELECT lo.id FROM license_offerings lo
                LEFT JOIN creative_works cw ON lo.work_id = cw.id
                WHERE lo.id::text LIKE 'demo-%' 
                   OR cw.id::text LIKE 'demo-%' 
                   OR cw.creator_id = demo_user_id
            );
        
        RAISE NOTICE 'Deleted demo orders';
        
        -- Now delete license offerings (should be safe)
        DELETE FROM license_offerings WHERE 
            id::text LIKE 'demo-%'
            OR work_id IN (
                SELECT id FROM creative_works 
                WHERE id::text LIKE 'demo-%' OR creator_id = demo_user_id
            );
        
        RAISE NOTICE 'Deleted demo license offerings';
        
        -- Delete creative works (should be safe now)
        DELETE FROM creative_works WHERE 
            id::text LIKE 'demo-%' OR creator_id = demo_user_id;
        
        RAISE NOTICE 'Deleted demo creative works';
        
        -- Finally delete the profile
        DELETE FROM profiles WHERE id = demo_user_id;
        
        RAISE NOTICE 'Deleted demo profile';
    ELSE
        RAISE NOTICE 'No demo user found';
    END IF;
END $$;

-- Also remove any demo auth user (optional - you may want to keep this for login testing)
-- DELETE FROM auth.users WHERE email = 'demo@creativechain.com';

COMMIT;

-- Summary: This removes all demo data we created:
-- ❌ Deleted demo royalty splits
-- ❌ Deleted demo orders
-- ❌ Deleted demo licenses  
-- ❌ Deleted demo license offerings
-- ❌ Deleted demo creative works
-- ❌ Deleted demo user profile
-- ✅ Your original data remains intact