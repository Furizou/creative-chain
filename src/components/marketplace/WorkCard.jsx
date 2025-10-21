"use client";

import Link from 'next/link';
import { Music } from 'lucide-react';

export default function WorkCard({ work }) {
  return (
    <Link 
      href={`/creator/works/${work.id}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="aspect-video bg-gray-100 relative">
        {work.file_url ? (
          <img 
            src={work.file_url} 
            alt={work.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{work.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {work.creator?.avatar_url ? (
                <img
                  src={work.creator.avatar_url}
                  alt={work.creator.full_name || 'Creator'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {work.creator?.full_name?.[0] || 'A'}
                </span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {work.creator?.full_name || 'Anonymous'}
            </span>
          </div>
          {work.category && (
            <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-sm">
              {work.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
