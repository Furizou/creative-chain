// src/components/dashboard/MetricsCard.jsx
export default function MetricsCard({ title, value, icon, color, subtitle, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className={`text-3xl font-black ${color || 'text-structural'}`}>{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
    </div>
  )
}