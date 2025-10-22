'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MetricsCard from '@/components/dashboard/MetricsCard';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalWorks: 0,
    totalRevenue: 0,
    totalSales: 0,
    availableBalance: 0,
    recentWorks: []
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        
        // Fetch creator analytics
        const analyticsResponse = await fetch('/api/analytics/creator-earnings?group_by=work', {
          credentials: 'include'
        });
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          
          if (analyticsData.success) {
            setDashboardData({
              totalWorks: analyticsData.grouped_data?.length || 0,
              totalRevenue: analyticsData.summary?.total_revenue?.idr || 0,
              totalSales: analyticsData.summary?.total_sales || 0,
              availableBalance: analyticsData.summary?.creator_earnings?.idr || 0,
              recentWorks: analyticsData.top_works?.slice(0, 5) || []
            });
          }
        }
        
        // Fetch recent works if analytics doesn't have them
        if (dashboardData.recentWorks.length === 0) {
          const worksResponse = await fetch('/api/creative-works?limit=5&sort_by=created_at&sort_order=desc', {
            credentials: 'include'
          });
          
          if (worksResponse.ok) {
            const worksData = await worksResponse.json();
            if (worksData.success) {
              setDashboardData(prev => ({
                ...prev,
                recentWorks: worksData.data || []
              }));
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-structural">Creator Dashboard</h1>
          <p className="text-structural/70 mt-2">Overview of your creative works performance</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Works"
            value={dashboardData.totalWorks}
            icon="📁"
            color="text-primary"
            loading={loadingData}
          />
          <MetricsCard
            title="Total Revenue"
            value={`Rp ${dashboardData.totalRevenue.toLocaleString()}`}
            subtitle="All time earnings"
            icon="📈"
            color="text-secondary"
            loading={loadingData}
          />
          <MetricsCard
            title="Total Sales"
            value={dashboardData.totalSales}
            subtitle="License purchases"
            icon="📋"
            color="text-structural"
            loading={loadingData}
          />
          <MetricsCard
            title="Available Balance"
            value={`Rp ${dashboardData.availableBalance.toLocaleString()}`}
            subtitle="Ready to withdraw"
            icon="🏦"
            color="text-primary"
            loading={loadingData}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-structural mb-2">View Analytics</h3>
            <p className="text-structural/70 text-sm mb-4">Deep dive into your earnings and performance</p>
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center px-4 py-2 bg-primary text-structural rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Analytics
            </Link>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-structural mb-2">Manage Works</h3>
            <p className="text-structural/70 text-sm mb-4">Edit licenses and view work performance</p>
            <Link
              href="/creator/works"
              className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Manage Works
            </Link>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-structural mb-2">Withdraw Funds</h3>
            <p className="text-structural/70 text-sm mb-4">Transfer earnings to your bank account</p>
            <Link
              href="/dashboard/earnings"
              className="inline-flex items-center px-4 py-2 bg-structural text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Withdraw Funds
            </Link>
          </div>
        </div>

        {/* Recent Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-structural">Recent Works</h2>
              <Link
                href="/creator/works"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {loadingData ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData.recentWorks.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentWorks.map((work, index) => (
                  <div key={work.work_id || work.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-structural">
                        {work.title || work.work_title || 'Untitled Work'}
                      </h3>
                      <p className="text-sm text-structural/70">
                        {work.sales_count || 0} sales • Rp {(work.revenue_idr || 0).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/creator/works/${work.work_id || work.id}`}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-medium text-structural mb-2">No works yet. Upload your first creative work!</h3>
                <Link
                  href="/creator/works/new"
                  className="inline-flex items-center px-6 py-3 bg-primary text-structural rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Upload Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}