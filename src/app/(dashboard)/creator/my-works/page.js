"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import PageHeader from '@/components/PageHeader';
import WorkCard from '@/components/WorkCard';

export default function MyWorksPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchWorks = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("works").select("*");
      if (error) console.error("Error fetching works:", error);
      else setWorks(data);
      setLoading(false);
    };

    fetchWorks();
  }, []);

  if (loading) return <p className="p-8">Loading your works...</p>;

  return (
    <div className="p-8 space-y-4">
      <PageHeader title="🎨 My Works" />

      {works.length === 0 ? (
        <p>No works yet.</p>
      ) : (
        <ul className="space-y-4">
          {works.map(work => <WorkCard key={work.id} work={work} />)}
        </ul>
      )}
    </div>
  );
}
