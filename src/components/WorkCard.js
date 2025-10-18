"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function WorkCard({ work }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/creator/works/${work.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleClick}
    >
      {work.coverImage && (
        <div className="relative w-full h-48">
          <Image
            src={work.coverImage}
            alt={work.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-structural">{work.title}</h2>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{work.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{work.creator}</span>
          <Link 
            href={`/creator/works/${work.id}/configure`}
            className="text-primary hover:text-primary/80 text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Configure License
          </Link>
        </div>
      </div>
    </div>
  );
}
