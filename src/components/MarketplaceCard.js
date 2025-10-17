"use client";
import Link from 'next/link';

export default function MarketplaceCard({ work }){
  return (
    <Link href={`/works/${work.id}`} className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {work.file_url && (
        <div className="aspect-video bg-gray-100">
          <img src={work.file_url} alt={work.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{work.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{work.description}</p>
        <div className="mt-2 text-sm text-gray-500">{work.category && <span className="inline-block bg-gray-100 rounded px-2 py-1">{work.category}</span>}</div>
      </div>
    </Link>
  );
}
