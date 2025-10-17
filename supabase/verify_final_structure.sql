-- 
-- Comprehensive Database Structure Verification Script
-- Run this in Supabase SQL Editor to verify final database structure
--

-- =====================================================
-- 1. VERIFY ALL TABLES EXIST WITH CORRECT STRUCTURE
-- =====================================================

SELECT 'TABLE VERIFICATION' as test_section;

-- Check all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'analytics_events', 'copyright_certificates', 'creative_works',
            'custodial_wallets', 'license_offerings', 'licenses', 'orders',
            'profiles', 'royalty_distributions', 'royalty_splits'
        ) THEN '✅ Required table exists'
        ELSE '⚠️ Unknown table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. VERIFY COLUMN STRUCTURES
-- =====================================================

SELECT 'COLUMN VERIFICATION' as test_section;

-- Analytics Events columns
SELECT 'analytics_events' as table_name, 
       string_agg(column_name || ':' || data_type, ', ') as columns
FROM information_schema.columns 
WHERE table_name = 'analytics_events' AND table_schema = 'public';

-- Creative Works columns  
SELECT 'creative_works' as table_name,
       string_agg(column_name || ':' || data_type, ', ') as columns
FROM information_schema.columns 
WHERE table_name = 'creative_works' AND table_schema = 'public';

-- Licenses columns (should include new columns)
SELECT 'licenses' as table_name,
       string_agg(column_name || ':' || data_type, ', ') as columns
FROM information_schema.columns 
WHERE table_name = 'licenses' AND table_schema = 'public';

-- =====================================================
-- 3. VERIFY FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 'FOREIGN KEY VERIFICATION' as test_section;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ FK exists' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 4. VERIFY CONSTRAINTS AND CHECKS
-- =====================================================

SELECT 'CONSTRAINT VERIFICATION' as test_section;

-- Check constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause,
    '✅ Constraint exists' as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- Unique constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    '✅ Unique constraint' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name;

-- =====================================================
-- 5. VERIFY INDEXES
-- =====================================================

SELECT 'INDEX VERIFICATION' as test_section;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    '✅ Index exists' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'analytics_events', 'copyright_certificates', 'creative_works',
    'custodial_wallets', 'license_offerings', 'licenses', 'orders',
    'profiles', 'royalty_distributions', 'royalty_splits'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 6. VERIFY RLS POLICIES
-- =====================================================

SELECT 'RLS POLICY VERIFICATION' as test_section;

SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    '✅ Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
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
-- 7. VERIFY FUNCTIONS AND TRIGGERS
-- =====================================================

SELECT 'FUNCTION VERIFICATION' as test_section;

-- Check for update_updated_at_column function
SELECT 
    routine_name,
    routine_type,
    '✅ Function exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%updated_at%';

-- Check triggers
SELECT 
    event_object_table as table_name,
    trigger_name,
    action_timing,
    event_manipulation,
    '✅ Trigger exists' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- =====================================================
-- 8. DATA TYPE VERIFICATION
-- =====================================================

SELECT 'DATA TYPE VERIFICATION' as test_section;

-- Check for proper UUID columns
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ UUID type correct'
        ELSE '⚠️ Check data type'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%_id'
AND table_name IN (
    'analytics_events', 'copyright_certificates', 'creative_works',
    'custodial_wallets', 'license_offerings', 'licenses', 'orders',
    'profiles', 'royalty_distributions', 'royalty_splits'
)
ORDER BY table_name, column_name;

-- Check numeric precision for money fields
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN column_name LIKE '%price%' OR column_name LIKE '%amount%' 
        THEN '✅ Money field found'
        ELSE '📊 Numeric field'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'numeric'
ORDER BY table_name, column_name;

-- =====================================================
-- 9. SAMPLE DATA TEST (NON-DESTRUCTIVE)
-- =====================================================

SELECT 'SAMPLE DATA TEST' as test_section;

-- Count records in each table
SELECT 'profiles' as table_name, count(*) as record_count FROM profiles
UNION ALL
SELECT 'creative_works', count(*) FROM creative_works
UNION ALL  
SELECT 'copyright_certificates', count(*) FROM copyright_certificates
UNION ALL
SELECT 'license_offerings', count(*) FROM license_offerings
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'licenses', count(*) FROM licenses
UNION ALL
SELECT 'royalty_splits', count(*) FROM royalty_splits
UNION ALL
SELECT 'royalty_distributions', count(*) FROM royalty_distributions
UNION ALL
SELECT 'analytics_events', count(*) FROM analytics_events
UNION ALL
SELECT 'custodial_wallets', count(*) FROM custodial_wallets
ORDER BY table_name;

-- =====================================================
-- 10. EXTENSION VERIFICATION
-- =====================================================

SELECT 'EXTENSION VERIFICATION' as test_section;

SELECT 
    extname as extension_name,
    '✅ Extension installed' as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- Test UUID generation
SELECT 
    'UUID Generation Test' as test_name,
    uuid_generate_v4() as sample_uuid,
    '✅ UUID generation working' as status;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT 'TEST SUMMARY' as section;

SELECT 
    'Database Structure Verification Complete' as message,
    now() as completed_at,
    '🎉 All tests executed' as status;