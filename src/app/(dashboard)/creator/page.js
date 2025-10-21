
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MetricsCard from '@/components/dashboard/MetricsCard'
import { Music, FileText, TrendingUp, Wallet, Palette, Camera } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch creator stats
    fetchCreatorStats()
    fetchRecentWorks()
  }, [])

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
      <div>
        <h1 className="text-4xl font-black text-structural">Creator Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your creative works performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Works"
          value={stats.totalWorks}
          icon={<Music className="w-6 h-6 text-primary" />}
          bgColor="bg-primary/10"
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
          icon={<FileText className="w-6 h-6 text-structural" />}
          bgColor="bg-structural/10"
          subtitle="License purchases"
        />
        <MetricsCard
          title="Available Balance"
          value={`Rp ${(stats.availableBalance || 0).toLocaleString('id-ID')}`}
          icon={<Wallet className="w-6 h-6 text-warning" />}
          bgColor="bg-warning/10"
          subtitle="Ready to withdraw"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-structural mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/analytics"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors group"
          >
            <h3 className="font-bold text-structural mb-2 group-hover:text-primary">
              View Analytics
            </h3>
            <p className="text-sm text-gray-600">
              Deep dive into your earnings and performance
            </p>
          </Link>
          
          <Link 
            href="/creator/works"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-secondary transition-colors group"
          >
            <h3 className="font-bold text-structural mb-2 group-hover:text-secondary">
              Manage Works
            </h3>
            <p className="text-sm text-gray-600">
              Edit licenses and view work performance
            </p>
          </Link>
          
          <Link 
            href="/dashboard/earnings"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-warning transition-colors group"
          >
            <h3 className="font-bold text-structural mb-2 group-hover:text-warning">
              Withdraw Funds
            </h3>
            <p className="text-sm text-gray-600">
              Transfer earnings to your bank account
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Works */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-structural">Recent Works</h2>
          <Link 
            href="/creator/works"
            className="text-primary font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>
        
        {recentWorks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No works yet. Upload your first creative work!</p>
            <Link 
              href="/creator/works/new"
              className="bg-primary text-structural px-6 py-2 rounded-lg font-semibold hover:opacity-80 inline-block"
            >
              Upload Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorks.map((work) => {
              const isImage = isImageUrl(work.file_url);
              const iconName = getCategoryIcon(work.category);

              // Map icon names to components
              const iconComponents = {
                Music,
                Palette,
                Camera,
                FileText
              };

              const IconComponent = iconComponents[iconName] || FileText;

              return (
                <Link
                  key={work.id}
                  href={`/creator/works/${work.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-base rounded-lg flex items-center justify-center overflow-hidden">
                      {work.file_url && isImage ? (
                        <img
                          src={work.file_url}
                          alt={work.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-structural">{work.title}</h3>
                      <p className="text-sm text-gray-600">{work.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-structural">{work.license_count || 0} Licenses</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}