import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
            CreativeChain
          </Link>
          <p className="text-gray-600 mt-2">Decentralized Copyright Protection</p>
        </div>
        
        {/* Auth Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>&copy; 2025 CreativeChain. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}