import Link from "next/link";
import BrandingDemo from "../../components/BrandingDemo";

export default function BrandingPage() {
  return (
    <div className="bg-base min-h-screen">
      <div className="p-4">
        <Link href="/">
          <button className="bg-structural text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity">
            ← Back to Home
          </button>
        </Link>
      </div>
      <BrandingDemo />
    </div>
  );
}
