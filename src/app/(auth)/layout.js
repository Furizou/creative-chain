import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary text-structural px-3 py-1 rounded font-black text-xl">
              CC
            </div>
            <span className="text-2xl font-black text-structural">CreativeChain</span>
          </Link>
          <p className="text-structural/70">Decentralized Copyright Protection</p>
        </div>
        
        {/* Auth Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {children}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-sm text-structural/50">
          <p>&copy; 2025 CreativeChain. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}