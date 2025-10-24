# SINAR - Blockchain-Powered Creative Rights Platform

![SINAR - Secure Intellectual NFT Asset Registry](public/hero_mascot.svg)

**SINAR** is a **blockchain-based platform** empowering creators to protect their work, manage licenses, and receive fair royalties **automatically via smart contracts**. We provide **immutable copyright certificates as NFTs** and a transparent system for royalty distribution.

---

## 🚀 Live Platform

**Explore the running application and marketplace:**
**[https://www.sinar.xyz/](https://www.sinar.xyz/)**

---

## ✨ Key Features

* **Immutable Copyright Protection:** Register works on the **Polygon blockchain**, minting verifiable **Copyright Certificate NFTs** (file hash stored on-chain).
* **Transparent Royalty Distribution:** **Smart contracts** instantly and fairly distribute payments to creators and collaborators based on customizable splits.
* **Flexible Licensing:** Issue tradeable **License NFTs** (Personal, Commercial, Exclusive) through the platform's marketplace.
* **User-Friendly Security:** Automated **custodial wallets** (AES-256-CBC encrypted) mean creators don't need crypto experience to participate.
* **Comprehensive Analytics:** Real-time tracking of earnings, sales activity, and work performance metrics.

---

## 🛠️ Tech Stack

### Frontend
* **Next.js 15.5.4** (App Router) / **React 19.1.0**
* **Tailwind CSS 4**

### Backend & Database
* **Next.js API Routes**
* **Supabase** (PostgreSQL, Auth, Storage)

### Blockchain
* **Polygon** (Amoy/Mainnet)
* **thirdweb SDK** & **Ethers.js** (for Smart Contracts and Custodial Wallets)

---

## 💻 Getting Started

### Prerequisites
* Node.js 18+, npm
* Supabase account
* thirdweb account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Furizou/creative-chain.git](https://github.com/Furizou/creative-chain.git)
    cd creative-chain
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Copy `.env.example` to `.env.local` and fill in API keys and contract addresses.
4.  **Set up Supabase:**
    Apply database migrations: `supabase migration up`
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Roadmap Highlights

* Multi-blockchain support (Ethereum, BSC)
* IPFS integration for decentralized file storage
* Advanced royalty splitting with thirdweb Split contracts
* Secondary marketplace for license trading

---

## 👋 Contributing

We welcome contributions! Please fork the repository, create a feature branch, and open a **Pull Request**.

* Follow existing code style and conventions.
* Write tests for new features.

---

## ⚖️ License

This project is licensed under the **MIT License**.

---

**Made with passion for creators worldwide** ✨
