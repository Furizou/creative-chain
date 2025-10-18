"use client";

export default function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] bg-gray-200 rounded"></div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 mb-2"></div>
      <div className="h-8 w-32 bg-gray-200"></div>
    </div>
  );
}
