import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-base text-structural min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-black mb-6">CreativeChain</h1>
          <p className="text-xl mb-8 text-gray-700">
            Empowering creators through blockchain technology. Build, collaborate, and monetize your creative work in a secure, decentralized ecosystem.
          </p>
          
          <div className="flex gap-4">
            <Link href="/branding">
              <button className="bg-primary text-structural px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                View Branding Guide
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
