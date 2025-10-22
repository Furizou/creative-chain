import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-base">
      <div className="pt-6 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="flex items-center justify-center mb-4">
              <Image
                src="/logo/logo_black.svg"
                alt="SINAR Logo"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-structural/70">Decentralized Copyright Protection</p>
          </div>
          
          {/* Auth Form Container */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {children}
          </div>
          
          {/* Footer */}
          <div className="text-center mt-8 text-sm text-structural/50">
            <p>&copy; 2025 SINAR. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}