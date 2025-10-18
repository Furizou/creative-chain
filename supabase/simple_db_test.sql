-- 
-- Simple Database Structure Test - Run this in Supabase SQL Editor
-- Copy paste this query block by block to test your final database structure
--

-- =====================================================
-- QUICK TABLE VERIFICATION
-- =====================================================

-- Check all 10 required tables exist
SELECT 
    'TABLE CHECK' as test_type,
    table_name,
    CASE 
        WHEN table_name IN (
            'analytics_events', 'copyright_certificates', 'creative_works',
            'custodial_wallets', 'license_offerings', 'licenses', 'orders',
            'profiles', 'royalty_distributions', 'royalty_splits'
        ) THEN '✅ REQUIRED TABLE EXISTS'
        ELSE '⚠️ EXTRA TABLE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE WHEN table_name IN (
        'analytics_events', 'copyright_certificates', 'creative_works',
        'custodial_wallets', 'license_offerings', 'licenses', 'orders',
        'profiles', 'royalty_distributions', 'royalty_splits'
    ) THEN 1 ELSE 2 END,
    table_name;

-- =====================================================
-- FOREIGN KEY RELATIONSHIPS TEST
-- =====================================================

-- Show all foreign key relationships
SELECT 
    'FOREIGN KEY CHECK' as test_type,
    tc.table_name || '.' || kcu.column_name as from_column,
    ccu.table_name || '.' || ccu.column_name as to_column,
    '✅ FK RELATIONSHIP' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- KEY COLUMN VERIFICATION
-- =====================================================

-- Check primary keys and important columns
SELECT 
    'COLUMN CHECK' as test_type,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ UUID PRIMARY KEY'
        WHEN column_name = 'id' AND data_type = 'bigint' THEN '✅ BIGINT PRIMARY KEY'
        WHEN column_name LIKE '%_id' AND data_type = 'uuid' THEN '✅ UUID FOREIGN KEY'
        WHEN column_name LIKE '%price%' AND data_type = 'numeric' THEN '✅ NUMERIC PRICE'
        WHEN column_name LIKE '%amount%' AND data_type = 'numeric' THEN '✅ NUMERIC AMOUNT'
        WHEN column_name LIKE '%_at' AND data_type = 'timestamp with time zone' THEN '✅ TIMESTAMP'
        ELSE '📋 COLUMN OK'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'analytics_events', 'copyright_certificates', 'creative_works',
    'custodial_wallets', 'license_offerings', 'licenses', 'orders',
    'profiles', 'royalty_distributions', 'royalty_splits'
)
AND (
    column_name = 'id' 
    OR column_name LIKE '%_id' 
    OR column_name LIKE '%price%' 
    OR column_name LIKE '%amount%'
    OR column_name LIKE '%_at'
)
ORDER BY table_name, 
    CASE 
        WHEN column_name = 'id' THEN 1
        WHEN column_name LIKE '%_id' THEN 2  
        WHEN column_name LIKE '%price%' THEN 3
        WHEN column_name LIKE '%amount%' THEN 4
        ELSE 5
    END,
    column_name;

-- =====================================================
-- RLS STATUS CHECK
-- =====================================================

-- Check RLS is enabled on all tables
SELECT 
    'RLS CHECK' as test_type,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'analytics_events', 'copyright_certificates', 'creative_works',
    'custodial_wallets', 'license_offerings', 'licenses', 'orders',
    'profiles', 'royalty_distributions', 'royalty_splits'
)
ORDER BY tablename;

-- =====================================================
-- TABLE COUNT CHECK
-- =====================================================

-- Quick record count check
SELECT 'RECORD COUNT' as test_type, 'profiles' as table_name, count(*) as records FROM profiles
UNION ALL
SELECT 'RECORD COUNT', 'creative_works', count(*) FROM creative_works
UNION ALL  
SELECT 'RECORD COUNT', 'copyright_certificates', count(*) FROM copyright_certificates
UNION ALL
SELECT 'RECORD COUNT', 'license_offerings', count(*) FROM license_offerings
UNION ALL
SELECT 'RECORD COUNT', 'orders', count(*) FROM orders
UNION ALL
SELECT 'RECORD COUNT', 'licenses', count(*) FROM licenses
UNION ALL
SELECT 'RECORD COUNT', 'royalty_splits', count(*) FROM royalty_splits
UNION ALL
SELECT 'RECORD COUNT', 'royalty_distributions', count(*) FROM royalty_distributions
UNION ALL
SELECT 'RECORD COUNT', 'analytics_events', count(*) FROM analytics_events
UNION ALL
SELECT 'RECORD COUNT', 'custodial_wallets', count(*) FROM custodial_wallets
ORDER BY table_name;

-- =====================================================
-- FINAL STATUS SUMMARY
-- =====================================================

SELECT 
    'SUMMARY' as test_type,
    '🎉 DATABASE STRUCTURE VERIFICATION COMPLETE' as message,
    now() as timestamp,
    '✅ READY FOR DEVELOPMENT' as status;