-- 1. Aktifkan RLS untuk setiap tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan untuk tabel 'profiles'
-- Pengguna hanya bisa melihat dan mengubah profil mereka sendiri[cite: 90].
DROP POLICY IF EXISTS "Users can view and edit their own profile." ON public.profiles;
CREATE POLICY "Users can view and edit their own profile."
ON public.profiles FOR ALL
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 3. Kebijakan untuk tabel 'creative_works'
-- Publik bisa melihat semua karya[cite: 95].
DROP POLICY IF EXISTS "Public can read creative works." ON public.creative_works;
CREATE POLICY "Public can read creative works."
ON public.creative_works FOR SELECT
USING ( true );

-- Kreator bisa membuat, membaca, mengubah, dan menghapus (CRUD) karya mereka sendiri[cite: 91].
DROP POLICY IF EXISTS "Creators can CRUD their own works." ON public.creative_works;
CREATE POLICY "Creators can CRUD their own works."
ON public.creative_works FOR ALL
USING ( auth.uid() = creator_id )
WITH CHECK ( auth.uid() = creator_id );

-- 4. (Praktik Terbaik) Kebijakan tambahan untuk tabel lain
-- Pengguna bisa melihat lisensi yang mereka beli.
DROP POLICY IF EXISTS "Users can view their own licenses." ON public.licenses;
CREATE POLICY "Users can view their own licenses."
ON public.licenses FOR SELECT
USING ( auth.uid() = buyer_id );

-- Kreator bisa melihat lisensi yang terjual dari karya mereka.
DROP POLICY IF EXISTS "Creators can view sales of their works." ON public.licenses;
CREATE POLICY "Creators can view sales of their works."
ON public.licenses FOR SELECT
USING ( (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() );

-- 5. Kebijakan untuk tabel 'copyright_certificates'
-- Publik bisa melihat sertifikat (untuk verifikasi)
DROP POLICY IF EXISTS "Public can view copyright certificates." ON public.copyright_certificates;
CREATE POLICY "Public can view copyright certificates."
ON public.copyright_certificates FOR SELECT
USING ( true );

-- Hanya kreator karya yang bisa membuat sertifikat
DROP POLICY IF EXISTS "Creators can create certificates for their works." ON public.copyright_certificates;
CREATE POLICY "Creators can create certificates for their works."
ON public.copyright_certificates FOR INSERT
WITH CHECK ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
);

-- 6. Kebijakan untuk tabel 'license_offerings'
-- Publik bisa melihat penawaran lisensi yang aktif
DROP POLICY IF EXISTS "Public can view active license offerings." ON public.license_offerings;
CREATE POLICY "Public can view active license offerings."
ON public.license_offerings FOR SELECT
USING ( is_active = true );

-- Kreator bisa mengelola penawaran lisensi untuk karya mereka
DROP POLICY IF EXISTS "Creators can manage their license offerings." ON public.license_offerings;
CREATE POLICY "Creators can manage their license offerings."
ON public.license_offerings FOR ALL
USING ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
)
WITH CHECK ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
);

-- 7. Kebijakan untuk tabel 'orders'
-- Pengguna bisa melihat pesanan mereka sendiri
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders."
ON public.orders FOR SELECT
USING ( auth.uid() = buyer_id );

-- Pengguna bisa membuat pesanan untuk diri mereka sendiri
DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
CREATE POLICY "Users can create their own orders."
ON public.orders FOR INSERT
WITH CHECK ( auth.uid() = buyer_id );

-- Pengguna bisa update pesanan yang masih pending
DROP POLICY IF EXISTS "Users can update their pending orders." ON public.orders;
CREATE POLICY "Users can update their pending orders."
ON public.orders FOR UPDATE
USING ( auth.uid() = buyer_id AND status = 'pending' )
WITH CHECK ( auth.uid() = buyer_id );

-- Kreator bisa melihat pesanan untuk karya mereka
DROP POLICY IF EXISTS "Creators can view orders for their works." ON public.orders;
CREATE POLICY "Creators can view orders for their works."
ON public.orders FOR SELECT
USING ( 
  (SELECT creator_id FROM public.creative_works cw 
   JOIN public.license_offerings lo ON cw.id = lo.work_id 
   WHERE lo.id = license_offering_id) = auth.uid() 
);

-- 8. Kebijakan untuk tabel 'royalty_distributions'
-- Penerima bisa melihat distribusi mereka
DROP POLICY IF EXISTS "Recipients can view their distributions." ON public.royalty_distributions;
CREATE POLICY "Recipients can view their distributions."
ON public.royalty_distributions FOR SELECT
USING ( auth.uid() = recipient_id );

-- Kreator bisa melihat distribusi untuk karya mereka
DROP POLICY IF EXISTS "Creators can view distributions for their works." ON public.royalty_distributions;
CREATE POLICY "Creators can view distributions for their works."
ON public.royalty_distributions FOR SELECT
USING ( 
  (SELECT creator_id FROM public.creative_works cw 
   JOIN public.licenses l ON cw.id = l.work_id 
   WHERE l.id = license_id) = auth.uid() 
);

-- Enable RLS for custodial_wallets table
ALTER TABLE custodial_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own wallet (but not the encrypted private key from frontend)
-- This policy should be restricted on the backend only
DROP POLICY IF EXISTS "Users can view their own wallet address" ON custodial_wallets;
CREATE POLICY "Users can view their own wallet address"
  ON custodial_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert wallets
DROP POLICY IF EXISTS "Service role can insert wallets" ON custodial_wallets;
CREATE POLICY "Service role can insert wallets"
  ON custodial_wallets
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Users cannot update their wallets (immutable)
-- Updates should only be done via service role if needed
DROP POLICY IF EXISTS "Service role can update wallets" ON custodial_wallets;
CREATE POLICY "Service role can update wallets"
  ON custodial_wallets
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- RLS Policy: Users cannot delete their wallets
-- Deletion should cascade from user deletion
DROP POLICY IF EXISTS "Service role can delete wallets" ON custodial_wallets;
CREATE POLICY "Service role can delete wallets"
  ON custodial_wallets
  FOR DELETE
  USING (auth.role() = 'service_role');