"use client";

import { useState, useEffect, useCallback } from 'react';
import { Music, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import WorkCard from '@/components/creator/WorkCard';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Create supabase client once
const supabase = createClient();

export default function CreatorWorks() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // Memoize fetchWorks to prevent recreation on each render
  const fetchWorks = useCallback(async (userSession) => {
    if (!userSession?.user?.id) return;

    try {
      // Fetch from creative_works table
      const { data, error: worksError } = await supabase
        .from('creative_works')
        .select('*')
        .eq('creator_id', userSession.user.id)
        .order('created_at', { ascending: false });

      if (worksError) {
        throw worksError;
      }

      setWorks(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching works:', error);
      setError(error.message || 'Failed to load your works');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) throw sessionError;

        setSession(currentSession);
        
        if (currentSession) {
          timeoutId = setTimeout(() => {
            if (mounted) {
              setLoading(true);
              fetchWorks(currentSession);
            }
          }, 500);
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Auth error:', error);
          setError('Authentication error');
          setLoading(false);
        }
      }
    };

    // Set up auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) {
          setLoading(true);
          fetchWorks(session);
        } else {
          setWorks([]);
          setLoading(false);
        }
      }
    });

    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [fetchWorks]);

  const handleRefresh = useCallback(() => {
    if (session) fetchWorks(session);
  }, [session, fetchWorks]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="My Works" />
        {session && (
          <Link
            href="/creator/works/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create New Work
          </Link>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
              <div className="border border-gray-200 border-t-0 rounded-b-lg p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !session ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Please Sign In</h3>
          <p className="text-gray-600">You need to be signed in to view your works</p>
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No works yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first creative work</p>
          <Link
            href="/creator/works/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Work
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {works.map(work => (
            <WorkCard 
              key={work.id} 
              work={work} 
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
