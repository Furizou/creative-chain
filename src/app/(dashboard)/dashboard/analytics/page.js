"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';

export default function DashboardAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        if (!user) return;
        
        const response = await fetch('/api/analytics/creator-earnings', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          throw new Error(result.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) loadAnalytics();
  }, [user, authLoading]);

  if (loading) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="text-warning text-xl mb-2">⚠️</div>
        <div className="text-structural">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Analytics Dashboard" subtitle="Deep dive into your earnings and performance" />
        
        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-structural mb-2">Total Sales</h3>
              <p className="text-3xl font-black text-primary">{data.summary.total_sales}</p>
              <p className="text-sm text-gray-500">License purchases</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-structural mb-2">Total Revenue</h3>
              <p className="text-3xl font-black text-secondary">
                Rp {(data.summary.total_revenue?.idr || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Gross earnings</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-structural mb-2">Your Earnings</h3>
              <p className="text-3xl font-black text-structural">
                Rp {(data.summary.creator_earnings?.idr || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">After royalty splits</p>
            </div>
          </div>
        )}

        {data?.top_works?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-structural">Top Performing Works</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.top_works.map((work, index) => (
                  <div key={work.work_id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-structural font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-structural">{work.title}</h3>
                        <p className="text-sm text-gray-500">{work.sales_count} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-structural">
                        Rp {(work.revenue_idr || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!data?.grouped_data?.length && !loading && (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-structural mb-2">No analytics data available</h3>
            <p className="text-gray-500 mb-4">Start selling licenses to see your analytics here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
