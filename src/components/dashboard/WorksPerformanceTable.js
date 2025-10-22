'use client'

export default function WorksPerformanceTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'Digital Art': 'bg-purple-100 text-purple-800',
      'Photography': 'bg-green-100 text-green-800',
      'Graphic Design': 'bg-blue-100 text-blue-800',
      'UI/UX Design': 'bg-orange-100 text-orange-800',
      'Music': 'bg-red-100 text-red-800',
      'Video': 'bg-yellow-100 text-yellow-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Works Performance</h3>
          <p className="text-sm text-gray-500">Performance metrics for all your creative works</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Work</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Revenue</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Sales</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Avg Price</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Recent Sales</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No works found. Create your first creative work to see performance data.
                </td>
              </tr>
            ) : (
              data.map((work) => (
                <tr key={work.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 truncate max-w-xs" title={work.title}>
                      {work.title}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(work.category)}`}>
                      {work.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(work.totalRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {work.totalSales}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(work.avgPrice)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {work.recentSales > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {work.recentSales}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-500">
                    {formatDate(work.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}