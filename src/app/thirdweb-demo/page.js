"use client";

import ConnectWallet from "@/components/ConnectWallet";
import WalletInfo from "@/components/WalletInfo";

export default function ThirdwebDemo() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Thirdweb Integration Demo
          </h1>
          <p className="text-gray-600">
            Connect your wallet to interact with Web3 features
          </p>
        </header>

        <div className="space-y-6">
          {/* Connect Wallet Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Connect Wallet
            </h2>
            <p className="text-gray-600 mb-4">
              Use the ConnectButton component to connect your wallet. Supports 500+ wallets.
            </p>
            <ConnectWallet />
          </section>

          {/* Wallet Info Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Wallet Information
            </h2>
            <p className="text-gray-600 mb-4">
              Once connected, your wallet details will appear below.
            </p>
            <WalletInfo />
          </section>

          {/* Integration Steps Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Integration Complete! ✓
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p>Installed thirdweb package</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p>Configured client ID in .env.local</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p>Created client configuration in src/lib/thirdweb/client.js</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p>Wrapped app with ThirdwebProvider in root layout</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <p>Created example components (ConnectWallet, WalletInfo)</p>
              </div>
            </div>
          </section>

          {/* Next Steps Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Next Steps
            </h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Read contract data using useReadContract hook</li>
              <li>Execute transactions with useSendTransaction hook</li>
              <li>Use thirdweb extensions for NFTs, tokens, and more</li>
              <li>Customize the ConnectButton appearance</li>
              <li>Add chain switching support</li>
            </ul>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                For more information, check out:{" "}
                <a
                  href="https://portal.thirdweb.com/references/typescript/v5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  thirdweb Documentation
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
