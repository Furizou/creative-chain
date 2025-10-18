'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/supabase/client'
import WorkCard from '@/components/marketplace/WorkCard'
import WorkCardSkeleton from '@/components/marketplace/WorkCardSkeleton'
import SearchBar from '@/components/marketplace/SearchBar'
import CategoryFilter from '@/components/marketplace/CategoryFilter'
import SortDropdown from '@/components/marketplace/SortDropdown'
import PaginationControls from '@/components/marketplace/PaginationControls'
import { Search, TrendingUp, Users, ShoppingBag } from 'lucide-react'

export default function MarketplacePage() {
  const [isPending, startTransition] = useTransition();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    totalWorks: 0,
    activeCreators: 0,
    totalTransactions: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'latest',
    page: 1
  });

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [filters]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/marketplace/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data || {
        totalWorks: 0,
        activeCreators: 0,
        totalTransactions: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('creative_works')
        .select('category');
      
      if (error) throw error;
      
      const validCategories = data
        ?.filter(item => item.category)
        ?.map(item => item.category) || [];
      const uniqueCategories = [...new Set(validCategories)].sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchWorks = async () => {
    // Don't show loading state for quick refreshes
    const loadingTimeout = setTimeout(() => {
      setLoadingWorks(true);
    }, 500);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      params.append('sort', filters.sort);
      params.append('page', filters.page.toString());

      const response = await fetch(`/api/creative-works?${params}`);
      if (!response.ok) throw new Error('Failed to fetch works');
      
      const data = await response.json();
      
      startTransition(() => {
        setWorks(data?.works || []);
        setPagination({
          total: data?.count || 0,
          pages: Math.ceil((data?.count || 0) / 12),
          hasNext: (data?.works?.length || 0) === 12,
          hasPrev: filters.page > 1
        });
      });
    } catch (error) {
      console.error('Error fetching works:', error);
      setWorks([]);
      setPagination({
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      clearTimeout(loadingTimeout);
      setLoadingWorks(false);
    }
  };

  const handleSearchChange = (search) => {
    startTransition(() => {
      setFilters({ ...filters, search, page: 1 });
    });
  };

  const handleCategoryChange = (category) => {
    startTransition(() => {
      setFilters({ ...filters, category, page: 1 });
    });
  };

  const handleSortChange = (sort) => {
    startTransition(() => {
      setFilters({ ...filters, sort, page: 1 });
    });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-lg">
        <h1 className="text-4xl font-black text-structural mb-2">Marketplace</h1>
        <p className="text-structural text-lg">
          Discover and license amazing creative works with blockchain-verified copyright
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Works</p>
              <p className="text-3xl font-bold text-structural">{(stats?.totalWorks || 0).toLocaleString()}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Creators</p>
              <p className="text-3xl font-bold text-structural">{(stats?.activeCreators || 0).toLocaleString()}</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-structural">{(stats?.totalTransactions || 0).toLocaleString()}</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <SearchBar 
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search works by title, creator, or description..."
            />
          </div>
          <div className="lg:col-span-3">
            <CategoryFilter 
              categories={categories}
              selectedCategory={filters.category}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          <div className="lg:col-span-3">
            <SortDropdown 
              value={filters.sort}
              onChange={handleSortChange}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {loadingWorks ? (
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
          ) : (
            <span>
              Showing <span className="font-semibold text-structural">{works.length}</span> of{' '}
              <span className="font-semibold text-structural">{pagination.total}</span> works
            </span>
          )}
        </div>
      </div>

      {/* Works Grid */}
      {loadingWorks ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <WorkCardSkeleton key={i} />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-structural mb-2">No works found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <PaginationControls
              currentPage={filters.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
            />
          )}
        </>
      )}
    </div>
  );
}
