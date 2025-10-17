"use client";
import Link from 'next/link';

export default function WorkCard({ work }){
  return (
    <li className="border p-4 rounded-lg">
      <h2 className="text-xl font-semibold">{work.title}</h2>
      <p className="text-gray-600">{work.description}</p>
      <div className="mt-2">
        <Link href={`/creator/works/${work.id}/configure`} className="text-blue-600 hover:underline">⚙️ Configure License</Link>
      </div>
    </li>
  );
}
