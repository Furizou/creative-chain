"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import PieChart from '@/components/charts/PieChart';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import { sampleChartData } from '@/utils/sampleChartData';

export default function CreatorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    // In real implementation, fetch data from API
    // For now, use sample data
    setData(sampleChartData);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8">Loading dashboard data...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8">No data available</div>;

  return (
    <div className="p-8">
      <PageHeader 
        title="Creator Dashboard" 
        subtitle="Overview of your creative works performance"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded bg-white shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">
            Rp {data.revenueByType.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 border rounded bg-white shadow-sm">
          <h3 className="text-gray-500 text-sm">Active Works</h3>
          <p className="text-2xl font-bold">{data.topWorks.length}</p>
        </div>
        <div className="p-4 border rounded bg-white shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Sales</h3>
          <p className="text-2xl font-bold">
            {data.salesTrend.reduce((sum, item) => sum + item.sales, 0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Revenue by License Type</h3>
          <PieChart data={data.revenueByType} />
        </div>
        <div className="p-6 border rounded bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Sales Trend (Last 7 Days)</h3>
          <LineChart data={data.salesTrend} />
        </div>
      </div>

      {/* Top Works */}
      <div className="border rounded bg-white shadow-sm p-6">
        <h3 className="font-semibold mb-4">Top Performing Works</h3>
        <BarChart data={data.topWorks} />
      </div>
    </div>
  );
}