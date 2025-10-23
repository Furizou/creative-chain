# SINAR - Blockchain-Powered Creative Rights Platform

![SINAR](public/hero_mascot.svg)

SINAR is a blockchain-based platform that empowers creators to protect their creative works, manage licenses, and receive fair royalties automatically through smart contracts. Built with transparency and creator rights at its core, SINAR provides immutable copyright certificates as NFTs and automated royalty distribution.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Blockchain Integration](#blockchain-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

**SINAR** (Secure Intellectual NFT Asset Registry) is a platform that solves key pain points in the creative industry:

- **Complex Copyright Registration** → Simple blockchain registration in minutes
- **Opaque Royalty Systems** → Transparent & automated royalty distribution
- **Payment Delays** → Instant payments via smart contracts
- **Piracy & Unauthorized Use** → Verifiable ownership prevents piracy
- **Difficult Ownership Proof** → Immutable proof of creation and ownership

## Key Features

### 1. Immutable Copyright Protection
- Register creative works on the blockchain for permanent, verifiable proof of ownership
- Copyright certificates minted as NFTs that can't be altered or disputed
- File hash (SHA-256) stored on-chain for integrity verification
- Full transaction transparency on Polygon blockchain

### 2. Transparent Royalty Distribution
- Automated royalty splits ensure fair and instant payments
- Smart contracts distribute payments directly to creators and collaborators
- Customizable royalty percentages for all stakeholders
- Real-time transaction tracking and analytics

### 3. Flexible Licensing System
- Multiple license types: Personal, Commercial Event, Broadcast (1-year), Exclusive
- License NFTs issued upon purchase
- Configurable pricing in Indonesian Rupiah (IDR)
- License validity tracking with expiration and usage limits

### 4. Secure & User-Friendly
- Custodial wallets managed automatically - no crypto experience needed
- AES-256-CBC encrypted private keys
- Secure authentication via Supabase Auth
- Intuitive creator dashboard and marketplace

### 5. Comprehensive Analytics
- Creator earnings tracking
- Sales activity monitoring
- Work performance metrics
- Revenue charts and insights

## How It Works

### Step 1: Upload & Register
Securely upload your work. SINAR generates a unique hash and mints an immutable Copyright Certificate NFT on the blockchain.

### Step 2: Configure Licenses
Define license types (personal, commercial, etc.) and set fair prices and royalty splits for collaborators.

### Step 3: Sell & Distribute
Smart contracts instantly distribute royalties from marketplace sales according to your rules.

### Step 4: Verify On-Chain
All transactions (copyrights, licenses, payments) are recorded publicly on the blockchain for complete transparency.

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Database, authentication, and storage
- **PostgreSQL** - Relational database with Row Level Security (RLS)

### Blockchain
- **Polygon Amoy Testnet** - EVM-compatible blockchain (production: Polygon mainnet)
- **thirdweb SDK** - Smart contract deployment and interaction
- **Ethers.js 5.7.2** - Ethereum library for wallet management
- **Smart Contracts**: Copyright NFT, License NFT

### Security
- **AES-256-CBC** encryption for custodial wallets
- **Row Level Security (RLS)** in Supabase
- **Service Role isolation** for sensitive operations

## Database Schema

### Core Tables

#### 1. `profiles`
Stores public user information linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users.id` |
| `username` | TEXT | Unique username |
| `full_name` | TEXT | User's full name |
| `avatar_url` | TEXT | Profile picture URL |
| `wallet_address` | TEXT | Polygon wallet address |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### 2. `custodial_wallets`
Manages encrypted private keys for user wallets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users.id` |
| `wallet_address` | TEXT | Public Ethereum address (0x...) |
| `encrypted_private_key` | TEXT | AES-256-CBC encrypted private key |
| `blockchain` | TEXT | Network identifier (polygon-amoy) |
| `created_at` | TIMESTAMP | Wallet creation time |

#### 3. `creative_works`
Central table storing all creative work metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `creator_id` | UUID | References `profiles.id` |
| `title` | TEXT | Work title |
| `description` | TEXT | Detailed description |
| `category` | TEXT | Category (Music, Digital Art, etc.) |
| `file_url` | TEXT | Supabase Storage URL |
| `file_hash` | TEXT | SHA-256 file hash |
| `nft_token_id` | TEXT | Copyright NFT token ID |
| `nft_tx_hash` | TEXT | Blockchain transaction hash |
| `created_at` | TIMESTAMP | Upload timestamp |

#### 4. `copyright_certificates`
Stores NFT copyright certificates minted on blockchain.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `creative_work_id` | UUID | References creative work |
| `user_id` | UUID | Creator's user ID |
| `token_id` | TEXT | NFT token ID |
| `transaction_hash` | TEXT | Unique blockchain transaction hash |
| `wallet_address` | TEXT | Recipient wallet address |
| `metadata` | JSONB | Full NFT metadata |
| `polygonscan_url` | TEXT | Link to Polygonscan |
| `minting_status` | TEXT | pending, confirmed, or failed |
| `minted_at` | TIMESTAMP | Minting timestamp |

#### 5. `licenses`
License NFT ledger tracking all license purchases.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `buyer_user_id` | UUID | License purchaser |
| `license_offering_id` | UUID | License offering reference |
| `order_id` | UUID | Purchase order reference |
| `token_id` | TEXT | License NFT token ID |
| `transaction_hash` | TEXT | Blockchain transaction hash |
| `wallet_address` | TEXT | Buyer wallet address |
| `metadata` | JSONB | License NFT metadata |
| `license_type` | TEXT | personal, commercial_event, broadcast_1year, exclusive |
| `expires_at` | TIMESTAMP | License expiration (NULL for perpetual) |
| `usage_limit` | INTEGER | Max uses allowed (NULL for unlimited) |
| `usage_count` | INTEGER | Current usage count |
| `is_valid` | BOOLEAN | License validity status |
| `minted_at` | TIMESTAMP | Minting timestamp |

#### 6. `royalty_splits`
Defines revenue distribution for creative works.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `work_id` | UUID | References `creative_works.id` |
| `recipient_address` | TEXT | Wallet address for royalty recipient |
| `split_percentage` | NUMERIC | Royalty percentage (e.g., 80.00) |
| `split_contract_address` | TEXT | thirdweb Split contract address |
| `created_at` | TIMESTAMP | Configuration creation time |

#### 7. `license_offerings`
Stores license configurations for creative works.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `work_id` | UUID | References `creative_works.id` |
| `license_type` | TEXT | License type identifier |
| `price_idr` | NUMERIC | Price in Indonesian Rupiah |
| `description` | TEXT | License terms description |
| `is_active` | BOOLEAN | Availability status |
| `created_at` | TIMESTAMP | Creation timestamp |

#### 8. `analytics_events`
Tracks user interactions for analytics dashboard.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Auto-incrementing primary key |
| `work_id` | UUID | Referenced creative work |
| `event_type` | TEXT | view, play, download |
| `user_id` | UUID | User who performed action (nullable) |
| `created_at` | TIMESTAMP | Event timestamp |

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (for database and authentication)
- **thirdweb account** (for blockchain integration)
- **Polygon Amoy testnet** tokens for testing

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Furizou/creative-chain.git
cd creative-chain
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file:
```bash
cp .env.example .env.local
```

Fill in the required environment variables (see [Environment Variables](#environment-variables) section).

4. **Set up Supabase**

Apply database migrations:
```bash
# Using Supabase CLI
supabase migration up
```

Or manually apply migration files in `supabase/migrations/` to your Supabase project.

5. **Deploy smart contracts**

Deploy Copyright NFT and License NFT contracts using thirdweb, then add contract addresses to `.env.local`.

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# thirdweb API Keys
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

# Smart Contract Addresses (Amoy Testnet)
NEXT_PUBLIC_COPYRIGHT_CONTRACT=0x...
NEXT_PUBLIC_LICENSE_CONTRACT=0x...

# Network
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=amoy

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Custodial Wallet Encryption
# Generate with: openssl rand -base64 32
WALLET_ENCRYPTION_KEY=your_32_character_encryption_key

# Testing (optional)
TEST_USER_ID=your_test_user_uuid
```

## Project Structure

```
creative-chain/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/              # Dashboard pages
│   │   │   ├── creator/              # Creator dashboard
│   │   │   │   ├── my-works/         # My works page
│   │   │   │   └── works/            # Work management
│   │   │   ├── marketplace/          # Marketplace
│   │   │   ├── profile/              # User profile
│   │   │   └── settings/             # User settings
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── blockchain/           # Blockchain operations
│   │   │   ├── creative-works/       # Work management
│   │   │   ├── licenses/             # License management
│   │   │   ├── payments/             # Payment processing
│   │   │   ├── wallet/               # Wallet operations
│   │   │   └── analytics/            # Analytics endpoints
│   │   ├── licenses/                 # My licenses page
│   │   ├── verify/                   # Certificate verification
│   │   └── page.js                   # Landing page
│   ├── components/                   # React components
│   │   ├── marketplace/              # Marketplace components
│   │   ├── dashboard/                # Dashboard components
│   │   └── ui/                       # Reusable UI components
│   ├── lib/                          # Utility libraries
│   │   ├── blockchain.js             # Blockchain utilities
│   │   ├── blockchain-minting.js     # NFT minting logic
│   │   ├── wallet-manager.js         # Custodial wallet management
│   │   ├── payment-gateway.js        # Payment processing
│   │   ├── supabase/                 # Supabase clients
│   │   └── thirdweb/                 # thirdweb configuration
│   └── tests/                        # Test files
│       ├── blockchain.test.js
│       ├── wallet-manager.test.js
│       └── verify-certificate-api.test.js
├── supabase/
│   └── migrations/                   # Database migrations
│       ├── 001_create_custodial_wallets.sql
│       ├── 002_create_copyright_certificates.sql
│       ├── 003_create_licenses.sql
│       ├── 003_update_licenses_for_nft.sql
│       └── 004_change_price_to_bidr.sql
├── public/                           # Static assets
├── .env.example                      # Environment template
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Creative Works
- `GET /api/creative-works` - List all works (with filters, pagination)
- `POST /api/creative-works/upload` - Upload new creative work

### Blockchain
- `POST /api/blockchain/mint-certificate` - Mint copyright certificate NFT
- `POST /api/blockchain/mint-license` - Mint license NFT
- `GET /api/blockchain/certificates` - Get user's certificates
- `POST /api/blockchain/verify-certificate` - Verify certificate authenticity
- `GET /api/blockchain/stats` - Get blockchain statistics

### Licenses
- `POST /api/licenses/configure` - Configure license offerings
- `POST /api/licenses/purchase` - Purchase a license
- `GET /api/licenses/my-licenses` - Get user's purchased licenses
- `GET /api/licenses/history/:workId` - Get license sales history

### Wallet
- `GET /api/wallet` - Get user's wallet information

### Payments
- `POST /api/payments/initiate` - Initiate payment process
- `POST /api/payments/webhook` - Payment gateway webhook

### Analytics
- `GET /api/analytics/creator-stats` - Creator statistics
- `GET /api/analytics/creator-earnings` - Earnings data
- `GET /api/analytics/revenue-chart` - Revenue chart data
- `GET /api/analytics/works-performance` - Work performance metrics

### Marketplace
- `GET /api/marketplace/stats` - Marketplace statistics

## Blockchain Integration

### Smart Contracts

SINAR uses two main smart contracts deployed on Polygon Amoy testnet:

1. **Copyright Certificate NFT Contract**
   - ERC-721 compliant NFT
   - Stores copyright ownership proof
   - Metadata includes file hash, creator, timestamp

2. **License NFT Contract**
   - ERC-721 compliant NFT
   - Represents purchased licenses
   - Metadata includes license type, terms, expiration

### Custodial Wallet System

SINAR manages wallets on behalf of users:

1. **Wallet Creation**: Automatic wallet generation on signup
2. **Encryption**: Private keys encrypted with AES-256-CBC
3. **Storage**: Encrypted keys stored in Supabase (never exposed to frontend)
4. **Transaction Signing**: Backend signs transactions using decrypted keys

### Blockchain Operations

- **Minting Copyright Certificates**: `src/lib/blockchain-minting.js`
- **Minting License NFTs**: `POST /api/blockchain/mint-license`
- **Verification**: `POST /api/blockchain/verify-certificate`
- **Transaction Tracking**: All transactions logged in database with Polygonscan URLs

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
# Blockchain tests
npm run test:blockchain

# Wallet manager tests
npm run test:wallet

# API tests
npm run test:blockchain-api
npm run test:verify-certificate
```

### Manual Testing Guide

See [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for comprehensive testing instructions.

### Getting Testnet Tokens

See [GET_TESTNET_MATIC.md](GET_TESTNET_MATIC.md) for instructions on obtaining Polygon Amoy testnet tokens.

## Deployment

### Prerequisites for Production

1. **Polygon Mainnet Setup**
   - Deploy contracts to Polygon mainnet
   - Update `NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon`
   - Fund custodial wallet with MATIC for gas fees

2. **Security Hardening**
   - Generate strong `WALLET_ENCRYPTION_KEY`
   - Enable Supabase RLS policies
   - Set up rate limiting
   - Configure CORS policies

3. **Environment Configuration**
   - Set all production environment variables
   - Use Vercel environment variables for secrets
   - Configure Supabase production project

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard before deployment.

### Database Migration

Apply migrations to production Supabase:

```bash
supabase db push --project-ref your-project-ref
```

## Roadmap

- [ ] Multi-blockchain support (Ethereum, BSC)
- [ ] IPFS integration for decentralized file storage
- [ ] Advanced royalty splitting with thirdweb Split contracts
- [ ] Mobile app (React Native)
- [ ] Creator verification badges
- [ ] Dispute resolution system
- [ ] Secondary marketplace for license trading
- [ ] Integration with major payment gateways (Stripe, PayPal)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## FAQ

### What blockchain does SINAR use?

SINAR currently operates on the **Polygon Amoy testnet** for demonstration purposes. We plan to migrate to the **Polygon mainnet** for full production deployment, ensuring low transaction fees and fast confirmation times.

### Do I need my own crypto wallet?

No, SINAR manages secure custodial wallets for you. When you sign up, we automatically create a secure wallet for your account, so you can focus on creating without worrying about complex wallet management.

### How are royalties split?

Creators define custom royalty percentages for themselves and collaborators. Our smart contracts automatically distribute payments instantly when licenses are purchased, ensuring everyone gets their fair share immediately.

### Is my uploaded file stored on the blockchain?

No, only proof of ownership (hash) is stored on the blockchain. Your actual files are stored securely off-chain in Supabase Storage, which keeps storage costs low while maintaining verifiable proof of ownership.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@sinar.io or open an issue in this repository.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [thirdweb](https://thirdweb.com/)
- Database and Auth by [Supabase](https://supabase.com/)
- Blockchain infrastructure by [Polygon](https://polygon.technology/)

---

**Made with passion for creators worldwide** ✨

**Secure Your Creativity, Own Your Rights.**
