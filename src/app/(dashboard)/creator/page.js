
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MetricsCard from '@/components/dashboard/MetricsCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import SalesActivityChart from '@/components/dashboard/SalesActivityChart'
import WorksPerformanceTable from '@/components/dashboard/WorksPerformanceTable'
import CategoryBreakdownChart from '@/components/dashboard/CategoryBreakdownChart'
import { Music, FileText, TrendingUp, Wallet, Palette, Camera, Eye, Download, Star, Calendar } from 'lucide-react'
import { isImageUrl, getCategoryIcon } from '@/lib/utils/fileUtils'

const supabase = createClient()

export default function CreatorDashboard() {
  const [stats, setStats] = useState({
    totalWorks: 0,
    totalRevenue: 0,
    totalSales: 0,
    availableBalance: 0
  })
  const [recentWorks, setRecentWorks] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [salesActivity, setSalesActivity] = useState({ dailyActivity: [], summary: {}, categoryBreakdown: [], licenseTypeBreakdown: [] })
  const [worksPerformance, setWorksPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    // Fetch all dashboard data
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchCreatorStats(),
        fetchRecentWorks(),
        fetchRevenueData(),
        fetchSalesActivity(),
        fetchWorksPerformance()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setChartsLoading(false)
    }
  }

  const fetchCreatorStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return;
      }

      const response = await fetch('/api/analytics/creator-stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalWorks: 0,
        totalRevenue: 0,
        totalSales: 0,
        availableBalance: 0
      });
    } finally {
      setLoading(false);
    }
  }

  const fetchRevenueData = async () => {
    try {
      // Check current session first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Client session before API call:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      const response = await fetch('/api/analytics/revenue-chart', {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Revenue chart response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Revenue chart data:', data);
        setRevenueData(data);
      } else {
        const error = await response.text();
        console.error('Revenue chart error:', error);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  }

  const fetchSalesActivity = async () => {
    try {
      const response = await fetch('/api/analytics/sales-activity');
      console.log('Sales activity response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Sales activity data:', data);
        setSalesActivity(data);
      } else {
        const error = await response.text();
        console.error('Sales activity error:', error);
      }
    } catch (error) {
      console.error('Error fetching sales activity:', error);
    }
  }

  const fetchWorksPerformance = async () => {
    try {
      const response = await fetch('/api/analytics/works-performance');
      console.log('Works performance response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Works performance data:', data);
        setWorksPerformance(data);
      } else {
        const error = await response.text();
        console.error('Works performance error:', error);
      }
    } catch (error) {
      console.error('Error fetching works performance:', error);
    }
  }

  const fetchRecentWorks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: works, error } = await supabase
        .from('creative_works')
        .select(`
          id,
          title,
          category,
          file_url,
          created_at,
          licenses!licenses_work_id_fkey (
            id,
            orders!licenses_order_id_fkey (
              amount_idr
            )
          )
        `)
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const worksWithStats = works?.map(work => ({
        ...work,
        license_count: work.licenses?.length || 0,
        total_revenue: work.licenses?.reduce((sum, license) => {
          const orderAmount = license.orders?.amount_idr || 0;
          return sum + Number(orderAmount);
        }, 0) || 0
      })) || [];

      setRecentWorks(worksWithStats);
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-structural">Creator Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive overview of your creative works performance and analytics</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/creator/works/new"
            className="bg-primary text-structural px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Upload Work
          </Link>
          {/* <Link 
            href="/creator/analytics"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Full Analytics
          </Link> */}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Works"
          value={stats.totalWorks}
          icon={<FileText className="w-6 h-6 text-primary" />}
          bgColor="bg-primary/10"
          subtitle="Creative works uploaded"
        />
        <MetricsCard
          title="Total Revenue"
          value={`Rp ${(stats.totalRevenue || 0).toLocaleString('id-ID')}`}
          icon={<TrendingUp className="w-6 h-6 text-secondary" />}
          bgColor="bg-secondary/10"
          subtitle="All time earnings"
        />
        <MetricsCard
          title="Total Sales"
          value={stats.totalSales}
          icon={<Star className="w-6 h-6 text-structural" />}
          bgColor="bg-structural/10"
          subtitle="License purchases"
        />
        <MetricsCard
          title="Available Balance"
          value={`Rp ${(stats.availableBalance || 0).toLocaleString('id-ID')}`}
          icon={<Wallet className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
          subtitle="Ready to withdraw"
        />
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Sales (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{salesActivity.summary.totalSales || 0}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Sale Value</p>
              <p className="text-2xl font-bold text-gray-900">Rp {(salesActivity.summary.avgSaleValue || 0).toLocaleString('id-ID')}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Performing</p>
              <p className="text-2xl font-bold text-gray-900">{worksPerformance[0]?.title?.substring(0, 15) || 'No data'}...</p>
            </div>
            <Palette className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">Rp {(salesActivity.summary.totalRevenue || 0).toLocaleString('id-ID')}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} loading={chartsLoading} />
        <SalesActivityChart data={salesActivity.dailyActivity} loading={chartsLoading} />
      </div>

      {/* Category and License Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart 
          data={salesActivity.categoryBreakdown} 
          loading={chartsLoading}
          title="Sales by Category"
        />
        <CategoryBreakdownChart 
          data={salesActivity.licenseTypeBreakdown} 
          loading={chartsLoading}
          title="Sales by License Type"
        />
      </div>

      {/* Works Performance Table */}
      <WorksPerformanceTable data={worksPerformance} loading={chartsLoading} />

      {/* Recent Works Summary */}
      {recentWorks.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-structural">Recent Works</h2>
            <Link 
              href="/creator/works"
              className="text-primary font-semibold hover:underline"
            >
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWorks.slice(0, 3).map((work) => {
              const isImage = isImageUrl(work.file_url);
              const iconName = getCategoryIcon(work.category);
              const iconComponents = { Music, Palette, Camera, FileText };
              const IconComponent = iconComponents[iconName] || FileText;

              return (
                <Link
                  key={work.id}
                  href={`/creator/works/${work.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-base rounded-lg flex items-center justify-center overflow-hidden">
                      {work.file_url && isImage ? (
                        <img
                          src={work.file_url}
                          alt={work.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{work.title}</h3>
                      <p className="text-sm text-gray-500">{work.category}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{work.license_count} sales</span>
                    <span className="font-semibold">Rp {work.total_revenue.toLocaleString('id-ID')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {recentWorks.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SINAR!</h3>
          <p className="text-gray-600 mb-6">Start by uploading your first creative work to see analytics and earn from your creativity.</p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/creator/works/new"
              className="bg-primary text-structural px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Upload Your First Work
            </Link>
            <Link 
              href="/marketplace"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}