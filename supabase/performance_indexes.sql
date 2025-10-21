-- Additional Performance Indexes for Sprint 18 APIs
-- Run these to optimize the new API endpoints

-- Composite indexes for common query patterns

-- Creative works search optimization
CREATE INDEX IF NOT EXISTS idx_creative_works_search_composite 
ON public.creative_works(category, created_at DESC) 
WHERE category IS NOT NULL;

-- License offerings pricing queries
CREATE INDEX IF NOT EXISTS idx_license_offerings_pricing 
ON public.license_offerings(work_id, is_active, price_idr) 
WHERE is_active = true;

-- License offerings by type
CREATE INDEX IF NOT EXISTS idx_license_offerings_type_active 
ON public.license_offerings(license_type, is_active, work_id) 
WHERE is_active = true;

-- Analytics earnings queries
CREATE INDEX IF NOT EXISTS idx_licenses_creator_earnings 
ON public.licenses(work_id, purchased_at DESC);

-- Composite index for creator analytics
CREATE INDEX IF NOT EXISTS idx_licenses_analytics_composite 
ON public.licenses(purchased_at, work_id);

-- Orders analytics
CREATE INDEX IF NOT EXISTS idx_orders_analytics 
ON public.orders(license_offering_id, status, created_at DESC) 
WHERE status = 'completed';

-- Transaction ledger optimization
CREATE INDEX IF NOT EXISTS idx_licenses_ledger_composite 
ON public.licenses(work_id, purchased_at DESC, buyer_id);

-- Royalty distributions queries
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_composite 
ON public.royalty_distributions(license_id, status, recipient_address);

-- Copyright certificates lookup
CREATE INDEX IF NOT EXISTS idx_copyright_certificates_lookup 
ON public.copyright_certificates(work_id, nft_token_id);

-- Profile username search (case insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles(LOWER(username));

-- Creative works title search (case insensitive)
CREATE INDEX IF NOT EXISTS idx_creative_works_title_lower 
ON public.creative_works(LOWER(title));

-- Analytics events optimization
CREATE INDEX IF NOT EXISTS idx_analytics_events_composite 
ON public.analytics_events(work_id, event_type, created_at DESC);

-- Full text search indexes (PostgreSQL specific)
-- These enable faster text search across multiple columns

-- Creative works full text search
CREATE INDEX IF NOT EXISTS idx_creative_works_fulltext 
ON public.creative_works 
USING gin((
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
));

-- Profiles full text search
CREATE INDEX IF NOT EXISTS idx_profiles_fulltext 
ON public.profiles 
USING gin((
  setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(username, '')), 'B')
));

-- View for optimized creative works browsing
CREATE OR REPLACE VIEW public.creative_works_browse AS
SELECT 
  cw.id,
  cw.title,
  cw.description,
  cw.category,
  cw.file_url,
  cw.file_hash,
  cw.nft_token_id,
  cw.nft_tx_hash,
  cw.created_at,
  cw.updated_at,
  
  -- Creator info
  p.id as creator_id,
  p.username as creator_username,
  p.full_name as creator_name,
  p.avatar_url as creator_avatar,
  p.wallet_address as creator_wallet,
  
  -- License summary
  COUNT(lo.id) FILTER (WHERE lo.is_active = true) as active_license_count,
  MIN(lo.price_idr) FILTER (WHERE lo.is_active = true) as min_price_idr,
  MAX(lo.price_idr) FILTER (WHERE lo.is_active = true) as max_price_idr,
  
  -- Copyright info
  cc.nft_token_id as copyright_token_id,
  cc.nft_contract_address as copyright_contract,
  cc.transaction_hash as copyright_tx_hash,
  
  -- Sales stats
  COUNT(l.id) as total_sales,
  COALESCE(SUM(o.amount_idr), 0) as total_revenue_idr

FROM public.creative_works cw
JOIN public.profiles p ON cw.creator_id = p.id
LEFT JOIN public.license_offerings lo ON cw.id = lo.work_id
LEFT JOIN public.copyright_certificates cc ON cw.id = cc.work_id
LEFT JOIN public.licenses l ON cw.id = l.work_id
LEFT JOIN public.orders o ON l.order_id = o.id AND o.status = 'completed'

GROUP BY 
  cw.id, cw.title, cw.description, cw.category, cw.file_url, cw.file_hash,
  cw.nft_token_id, cw.nft_tx_hash, cw.created_at, cw.updated_at,
  p.id, p.username, p.full_name, p.avatar_url, p.wallet_address,
  cc.nft_token_id, cc.nft_contract_address, cc.transaction_hash;

-- View for creator analytics summary
CREATE OR REPLACE VIEW public.creator_analytics_summary AS
SELECT 
  cw.creator_id,
  p.username,
  p.full_name,
  
  -- Work stats
  COUNT(DISTINCT cw.id) as total_works,
  COUNT(DISTINCT lo.id) FILTER (WHERE lo.is_active = true) as active_licenses,
  
  -- Sales stats
  COUNT(DISTINCT l.id) as total_sales,
  COALESCE(SUM(o.amount_idr), 0) as total_revenue_idr,
  COALESCE(SUM(o.amount_bidr), 0) as total_revenue_bidr,
  
  -- Recent activity
  COUNT(DISTINCT l.id) FILTER (
    WHERE l.purchased_at >= NOW() - INTERVAL '30 days'
  ) as sales_last_30_days,
  
  COALESCE(SUM(o.amount_idr) FILTER (
    WHERE o.created_at >= NOW() - INTERVAL '30 days'
  ), 0) as revenue_last_30_days_idr,
  
  -- Top performing work
  (
    SELECT cw2.title 
    FROM public.creative_works cw2
    JOIN public.licenses l2 ON cw2.id = l2.work_id
    JOIN public.orders o2 ON l2.order_id = o2.id
    WHERE cw2.creator_id = cw.creator_id AND o2.status = 'completed'
    GROUP BY cw2.id, cw2.title
    ORDER BY SUM(o2.amount_idr) DESC
    LIMIT 1
  ) as top_work_title

FROM public.creative_works cw
JOIN public.profiles p ON cw.creator_id = p.id
LEFT JOIN public.license_offerings lo ON cw.id = lo.work_id
LEFT JOIN public.licenses l ON cw.id = l.work_id
LEFT JOIN public.orders o ON l.order_id = o.id AND o.status = 'completed'

GROUP BY cw.creator_id, p.username, p.full_name;

-- Performance monitoring queries
-- Use these to check index usage and query performance

/*
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%creative_works%' OR query LIKE '%licenses%'
ORDER BY total_time DESC 
LIMIT 10;
*/

-- Comments for documentation
COMMENT ON VIEW public.creative_works_browse IS 'Optimized view for marketplace browsing with precomputed aggregates';
COMMENT ON VIEW public.creator_analytics_summary IS 'Summary statistics for creator analytics dashboard';

-- Grant permissions (adjust as needed for your RLS policies)
-- GRANT SELECT ON public.creative_works_browse TO anon, authenticated;
-- GRANT SELECT ON public.creator_analytics_summary TO authenticated;