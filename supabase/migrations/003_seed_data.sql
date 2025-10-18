--
-- Seed Data for CreativeChain Demo
-- Initial data for testing and development
--

-- NOTE: This file creates triggers and functions only
-- Sample data with actual user references should be added after users sign up through the auth system
-- The profiles, creative_works, licenses, and other user-related data will be populated when:
-- 1. Users sign up through Supabase Auth
-- 2. Profiles are created automatically via triggers or API
-- 3. Users upload creative works through the application

-- This seed file only contains:
-- 1. Database triggers for updated_at columns
-- 2. Any static reference data that doesn't depend on users

-- No sample user data is inserted here to avoid foreign key constraint violations

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_works_updated_at
  BEFORE UPDATE ON public.creative_works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_offerings_updated_at
  BEFORE UPDATE ON public.license_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custodial_wallets_updated_at
  BEFORE UPDATE ON custodial_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();