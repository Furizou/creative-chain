"use client";
import PageHeader from '@/components/PageHeader';
import MarketplaceCard from '@/components/MarketplaceCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardMarketplace(){
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      const { data } = await supabase.from('creative_works').select('*').limit(24);
      setWorks(data||[]);
      setLoading(false);
    };
    load();
  },[]);

  return (
    <div className="p-8">
      <PageHeader title="Marketplace (Dashboard)" />
      {loading? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {works.map(w=> <MarketplaceCard key={w.id} work={w} />)}
        </div>
      )}
    </div>
  );
}
 
