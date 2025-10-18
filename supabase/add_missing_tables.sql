--
-- Script untuk menambahkan tabel-tabel yang belum ada
-- Jalankan script ini jika ada tabel yang missing setelah menjalankan migration utama
--

-- Pastikan ekstensi UUID tersedia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Tabel: Copyright Certificates
-- Sertifikat hak cipta dalam bentuk NFT
--
CREATE TABLE IF NOT EXISTS public.copyright_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
    nft_token_id TEXT NOT NULL,
    nft_contract_address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    blockchain_network TEXT DEFAULT 'amoy',
    metadata_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.copyright_certificates IS 'NFT certificates for copyright protection.';

--
-- Tabel: License Offerings
-- Template lisensi yang tersedia untuk setiap karya
--
CREATE TABLE IF NOT EXISTS public.license_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL, -- 'Personal', 'Commercial', 'Exclusive'
    title TEXT NOT NULL,
    description TEXT,
    price_idr NUMERIC(12, 2) NOT NULL,
    price_bidr NUMERIC(12, 2) NOT NULL, -- Mock BIDR token price
    usage_limit INTEGER, -- NULL = unlimited
    duration_days INTEGER, -- NULL = lifetime
    terms TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.license_offerings IS 'Available license types and pricing for each work.';

--
-- Tabel: Orders
-- Pesanan pembelian lisensi
--
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_offering_id UUID NOT NULL REFERENCES public.license_offerings(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_idr NUMERIC(12, 2) NOT NULL,
    amount_bidr NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'mock_gateway',
    payment_session_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.orders IS 'Purchase orders for licenses.';

--
-- Tabel: Royalty Distributions
-- Catatan pembayaran royalti kepada kolaborator
--
CREATE TABLE IF NOT EXISTS public.royalty_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE RESTRICT,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_address TEXT NOT NULL,
    amount_idr NUMERIC(12, 2) NOT NULL,
    amount_bidr NUMERIC(12, 2) NOT NULL,
    split_percentage NUMERIC(5, 2) NOT NULL,
    transaction_hash TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.royalty_distributions IS 'Records of royalty payments made to collaborators.';

-- Update licenses table untuk menambahkan foreign key ke orders jika belum ada
DO $$ 
BEGIN
    -- Cek apakah kolom order_id sudah ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'licenses' 
                  AND column_name = 'order_id' 
                  AND table_schema = 'public') THEN
        
        -- Tambahkan kolom order_id
        ALTER TABLE public.licenses ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT;
        
        -- Tambahkan kolom license_offering_id jika belum ada
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'licenses' 
                      AND column_name = 'license_offering_id' 
                      AND table_schema = 'public') THEN
            ALTER TABLE public.licenses ADD COLUMN license_offering_id UUID REFERENCES public.license_offerings(id) ON DELETE RESTRICT;
        END IF;
        
        -- Tambahkan kolom tambahan untuk licenses jika belum ada
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'licenses' 
                      AND column_name = 'nft_token_id' 
                      AND table_schema = 'public') THEN
            ALTER TABLE public.licenses ADD COLUMN nft_token_id TEXT;
            ALTER TABLE public.licenses ADD COLUMN nft_contract_address TEXT;
            ALTER TABLE public.licenses ADD COLUMN nft_transaction_hash TEXT;
            ALTER TABLE public.licenses ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE public.licenses ADD COLUMN usage_count INTEGER DEFAULT 0;
            ALTER TABLE public.licenses ADD COLUMN usage_limit INTEGER;
        END IF;
        
    END IF;
END $$;

--
-- Indexes untuk tabel-tabel baru
--

-- Copyright certificates indexes
CREATE INDEX IF NOT EXISTS idx_copyright_certificates_work_id ON public.copyright_certificates(work_id);
CREATE INDEX IF NOT EXISTS idx_copyright_certificates_nft_token_id ON public.copyright_certificates(nft_token_id);

-- License offerings indexes
CREATE INDEX IF NOT EXISTS idx_license_offerings_work_id ON public.license_offerings(work_id);
CREATE INDEX IF NOT EXISTS idx_license_offerings_is_active ON public.license_offerings(is_active);
CREATE INDEX IF NOT EXISTS idx_license_offerings_license_type ON public.license_offerings(license_type);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_license_offering_id ON public.orders(license_offering_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Royalty distributions indexes
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_license_id ON public.royalty_distributions(license_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_recipient_id ON public.royalty_distributions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_status ON public.royalty_distributions(status);

-- Licenses indexes tambahan
CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON public.licenses(order_id);

--
-- RLS Policies untuk tabel-tabel baru
--

-- Enable RLS untuk tabel baru
ALTER TABLE public.copyright_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_distributions ENABLE ROW LEVEL SECURITY;

-- Policies untuk copyright_certificates
DROP POLICY IF EXISTS "Public can view copyright certificates." ON public.copyright_certificates;
CREATE POLICY "Public can view copyright certificates."
ON public.copyright_certificates FOR SELECT
USING ( true );

DROP POLICY IF EXISTS "Creators can create certificates for their works." ON public.copyright_certificates;
CREATE POLICY "Creators can create certificates for their works."
ON public.copyright_certificates FOR INSERT
WITH CHECK ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
);

-- Policies untuk license_offerings
DROP POLICY IF EXISTS "Public can view active license offerings." ON public.license_offerings;
CREATE POLICY "Public can view active license offerings."
ON public.license_offerings FOR SELECT
USING ( is_active = true );

DROP POLICY IF EXISTS "Creators can manage their license offerings." ON public.license_offerings;
CREATE POLICY "Creators can manage their license offerings."
ON public.license_offerings FOR ALL
USING ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
)
WITH CHECK ( 
  (SELECT creator_id FROM public.creative_works WHERE id = work_id) = auth.uid() 
);

-- Policies untuk orders
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders."
ON public.orders FOR SELECT
USING ( auth.uid() = buyer_id );

DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
CREATE POLICY "Users can create their own orders."
ON public.orders FOR INSERT
WITH CHECK ( auth.uid() = buyer_id );

DROP POLICY IF EXISTS "Users can update their pending orders." ON public.orders;
CREATE POLICY "Users can update their pending orders."
ON public.orders FOR UPDATE
USING ( auth.uid() = buyer_id AND status = 'pending' )
WITH CHECK ( auth.uid() = buyer_id );

DROP POLICY IF EXISTS "Creators can view orders for their works." ON public.orders;
CREATE POLICY "Creators can view orders for their works."
ON public.orders FOR SELECT
USING ( 
  (SELECT creator_id FROM public.creative_works cw 
   JOIN public.license_offerings lo ON cw.id = lo.work_id 
   WHERE lo.id = license_offering_id) = auth.uid() 
);

-- Policies untuk royalty_distributions
DROP POLICY IF EXISTS "Recipients can view their distributions." ON public.royalty_distributions;
CREATE POLICY "Recipients can view their distributions."
ON public.royalty_distributions FOR SELECT
USING ( auth.uid() = recipient_id );

DROP POLICY IF EXISTS "Creators can view distributions for their works." ON public.royalty_distributions;
CREATE POLICY "Creators can view distributions for their works."
ON public.royalty_distributions FOR SELECT
USING ( 
  (SELECT creator_id FROM public.creative_works cw 
   JOIN public.licenses l ON cw.id = l.work_id 
   WHERE l.id = license_id) = auth.uid() 
);

--
-- Triggers untuk updated_at
--

-- Pastikan function update_updated_at_column ada
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk tabel yang memiliki updated_at
DROP TRIGGER IF EXISTS update_license_offerings_updated_at ON public.license_offerings;
CREATE TRIGGER update_license_offerings_updated_at
  BEFORE UPDATE ON public.license_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();