"use client";

export default function ChartFilters({ 
  period, 
  onPeriodChange,
  category,
  onCategoryChange,
  onExport 
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="px-3 py-2 border rounded"
      >
        <option value="day">Last 24 Hours</option>
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
        <option value="year">Last 12 Months</option>
      </select>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3 py-2 border rounded"
      >
        <option value="all">All Categories</option>
        <option value="music">Music</option>
        <option value="art">Digital Art</option>
        <option value="video">Video</option>
        <option value="photo">Photography</option>
      </select>

      <button
        onClick={onExport}
        className="px-4 py-2 bg-white border rounded hover:bg-gray-50 text-sm flex items-center gap-2"
      >
        <span>📊</span> Export Data
      </button>
    </div>
  );
}
