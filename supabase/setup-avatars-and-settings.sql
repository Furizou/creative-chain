-- ========================================
-- SETUP: Avatars Bucket & User Settings
-- ========================================
-- Run this in Supabase SQL Editor to fix avatar upload and settings

-- ========================================
-- 1. CREATE AVATARS BUCKET
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- 2. AVATAR BUCKET POLICIES
-- ========================================
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ========================================
-- 3. CREATE USER_SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  marketplace_notifications boolean DEFAULT true,
  order_notifications boolean DEFAULT true,
  royalty_notifications boolean DEFAULT true,
  payment_notifications boolean DEFAULT true,
  privacy_public_profile boolean DEFAULT true,
  privacy_show_works boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ========================================
-- 4. USER_SETTINGS ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_view_own_settings" ON public.user_settings;
CREATE POLICY "users_can_view_own_settings" ON public.user_settings
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_update_own_settings" ON public.user_settings;
CREATE POLICY "users_can_update_own_settings" ON public.user_settings
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_insert_own_settings" ON public.user_settings;
CREATE POLICY "users_can_insert_own_settings" ON public.user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_delete_own_settings" ON public.user_settings;
CREATE POLICY "users_can_delete_own_settings" ON public.user_settings
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. DONE
-- ========================================
-- All done! Now avatar upload and settings should work.
