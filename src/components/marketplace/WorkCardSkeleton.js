// src/components/marketplace/WorkCardSkeleton.js
export default function WorkCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="w-full h-48 bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        
        {/* Creator Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Category and Price Skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-24" />
        </div>
        
        {/* License Info Skeleton */}
        <div className="pt-3 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  );
}
