"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { LineChart, PieChart } from '@/components/AnalyticsChart';
import ChartFilters from '@/components/ChartFilters';
import { exportToCSV, formatChartDataForExport } from '@/utils/exportUtils';

export default function DashboardAnalytics(){
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('all');

  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true);
        setError('');
        if (!user) return;
        const res = await fetch(`/api/analytics/creator-earnings?period=${period}&category=${category}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      }catch(err){
        console.error(err);
        setError('Failed to load analytics');
      }finally{setLoading(false);}    
    };
    if (!authLoading) load();
  },[user, authLoading, period, category]);

  const handleExport = () => {
    const salesData = formatChartDataForExport(
      {
        labels: Object.keys(data?.salesByDay || {}),
        datasets: [{
          label: 'Sales',
          data: Object.values(data?.salesByDay || {})
        }]
      },
      period,
      category
    );
    
    exportToCSV(salesData, `analytics-${period}-${category}-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <PageHeader title="Analytics" subtitle="Creator performance" />
      
      <ChartFilters
        period={period}
        onPeriodChange={setPeriod}
        category={category}
        onCategoryChange={setCategory}
        onExport={handleExport}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h4 className="font-semibold mb-2">Revenue by License</h4>
          <PieChart parts={Object.entries(data?.revenueByType || {}).map(([k,v],i)=>({ value: v, color: ['#4F46E5','#06B6D4','#F97316','#10B981','#EF4444'][i%5] }))} />
        </div>
        <div className="p-4 border rounded">
          <h4 className="font-semibold mb-2">Sales Over Time</h4>
          <LineChart points={Object.values(data?.salesByDay || {})} />
        </div>
        <div className="p-4 border rounded md:col-span-2">
          <h4 className="font-semibold mb-2">Top Works</h4>
          <div>
            <ol className="list-decimal pl-6">
              {data?.topWorks?.map(w=> (
                <li key={w.workId} className="mb-1">{w.title} — {w.revenue}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
