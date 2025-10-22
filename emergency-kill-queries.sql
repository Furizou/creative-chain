-- Emergency: Kill All Connections and Reset
-- Use this ONLY if queries are completely stuck

-- 1. First try to see active queries:
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- 2. If needed, kill specific problematic queries:
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = YOUR_PID_HERE;

-- 3. Or kill all non-essential connections (DANGEROUS - use with caution):
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = current_database();