import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-base text-structural min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black mb-4">CreativeChain</h1>
        <p className="text-lg mb-8">
          Creative collaboration platform powered by blockchain technology.
        </p>
        
        <Link href="/branding">
          <button className="bg-primary text-structural px-6 py-3 rounded-lg font-semibold hover:opacity-80 transition-opacity">
            View Branding Guide
          </button>
        </Link>
      </div>
    </div>
  );
}
