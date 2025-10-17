--
-- Ekstensi untuk mengaktifkan fungsi gen_random_uuid() jika belum aktif
--
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Tabel 1: Profiles
-- Menyimpan data publik pengguna, terhubung dengan sistem otentikasi Supabase.
--
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information, linked to Supabase auth.';

--
-- Tabel 2: Creative Works
-- Menyimpan metadata untuk setiap karya kreatif yang diunggah.
--
CREATE TABLE IF NOT EXISTS public.creative_works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    file_url TEXT NOT NULL, -- URL dari Supabase Storage
    file_hash TEXT, -- SHA-256 hash dari file
    nft_token_id TEXT, -- ID token dari kontrak NFT
    nft_tx_hash TEXT, -- Hash transaksi minting NFT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.creative_works IS 'Metadata for each uploaded creative work.';

--
-- Tabel 3: Royalty Splits
-- Mendefinisikan bagaimana royalti dibagi untuk setiap karya kreatif.
--
CREATE TABLE IF NOT EXISTS public.royalty_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
    recipient_address TEXT NOT NULL,
    split_percentage NUMERIC(5, 2) NOT NULL CHECK (split_percentage > 0 AND split_percentage <= 100),
    split_contract_address TEXT, -- Alamat smart contract "Split"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.royalty_splits IS 'Defines royalty distribution for a creative work.';

--
-- Tabel 4: Copyright Certificates
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
-- Tabel 5: License Offerings
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
-- Tabel 6: Orders
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
-- Tabel 7: Licenses
-- Mencatat setiap transaksi pembelian lisensi yang sudah selesai.
--
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    license_offering_id UUID NOT NULL REFERENCES public.license_offerings(id) ON DELETE RESTRICT,
    nft_token_id TEXT, -- License NFT token ID
    nft_contract_address TEXT,
    nft_transaction_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = lifetime license
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.licenses IS 'Records every completed license purchase transaction.';

--
-- Tabel 8: Royalty Distributions
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

--
-- Tabel 9: Analytics Events
-- Mencatat event seperti tayangan, pemutaran, dan unduhan untuk analitik.
--
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'view', 'play', 'download'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Bisa anonim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.analytics_events IS 'Tracks events like views, plays, and downloads for analytics.';

-- Create custodial_wallets table
-- This table stores encrypted private keys for user-managed wallets

CREATE TABLE IF NOT EXISTS custodial_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  blockchain TEXT NOT NULL DEFAULT 'polygon-amoy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id (one wallet per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_custodial_wallets_user_id
  ON custodial_wallets(user_id);

-- Create index on wallet_address for fast lookups
CREATE INDEX IF NOT EXISTS idx_custodial_wallets_address
  ON custodial_wallets(wallet_address);

-- Add comment for documentation
COMMENT ON TABLE custodial_wallets IS 'Stores encrypted private keys for custodial wallets managed by the platform';
COMMENT ON COLUMN custodial_wallets.encrypted_private_key IS 'AES-256-CBC encrypted private key - NEVER expose to frontend';
COMMENT ON COLUMN custodial_wallets.wallet_address IS 'Public Ethereum address (0x...)';
COMMENT ON COLUMN custodial_wallets.blockchain IS 'Blockchain network identifier (e.g., polygon-amoy, polygon-mainnet)';

--
-- Indexes untuk performa optimal
--
-- Creative works indexes
CREATE INDEX IF NOT EXISTS idx_creative_works_creator_id ON public.creative_works(creator_id);
CREATE INDEX IF NOT EXISTS idx_creative_works_category ON public.creative_works(category);
CREATE INDEX IF NOT EXISTS idx_creative_works_created_at ON public.creative_works(created_at DESC);

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

-- Licenses indexes
CREATE INDEX IF NOT EXISTS idx_licenses_buyer_id ON public.licenses(buyer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_work_id ON public.licenses(work_id);
CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON public.licenses(order_id);
CREATE INDEX IF NOT EXISTS idx_licenses_purchased_at ON public.licenses(purchased_at DESC);

-- Royalty splits indexes
CREATE INDEX IF NOT EXISTS idx_royalty_splits_work_id ON public.royalty_splits(work_id);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_recipient_address ON public.royalty_splits(recipient_address);

-- Royalty distributions indexes
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_license_id ON public.royalty_distributions(license_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_recipient_id ON public.royalty_distributions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_status ON public.royalty_distributions(status);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_work_id ON public.analytics_events(work_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);