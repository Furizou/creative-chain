'use client';

import { FileText, Shield, MoreVertical, Music, Palette, Camera } from 'lucide-react';
import Link from 'next/link';
import { isImageUrl, getCategoryIcon } from '@/lib/utils/fileUtils';

export default function WorkCard({ work, onRefresh }) {
  // Use thumbnail_url if available, otherwise fallback to file_url
  const imageUrl = work.thumbnail_url || work.file_url;
  const isImage = isImageUrl(imageUrl);
  const iconName = getCategoryIcon(work.category);

  // Map icon names to components
  const iconComponents = {
    Music,
    Palette,
    Camera,
    FileText
  };

  const IconComponent = iconComponents[iconName] || FileText;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Thumbnail */}
      <Link href={`/creator/works/${work.id}`}>
        <div className="w-full h-48 bg-gray-50 flex items-center justify-center relative overflow-hidden">
          {imageUrl && isImage ? (
            <img
              src={imageUrl}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <IconComponent className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform" />
          )}
          {work.copyright_certificate && (
            <div className="absolute top-2 right-2 bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/creator/works/${work.id}`}>
          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {work.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {work.description || 'No description provided'}
        </p>

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            work.status === 'published' ? 'bg-green-100 text-green-800' :
            work.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {work.status || 'draft'}
          </span>
          
          <div className="flex gap-2">
            <Link
              href={`/creator/works/${work.id}/configure`}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Configure
            </Link>
            <Link
              href={`/creator/works/${work.id}/edit`}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium"
            >
              Edit
            </Link>
          </div>
        </div>

        {work.license_count > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {work.license_count} active licenses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
