"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { ShoppingCart, Download, Users, DollarSign, Clock, Tag } from 'lucide-react';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchWorkDetails();
    }
  }, [params.id]);

  const fetchWorkDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creative-works/${params.id}`);
      const result = await response.json();
      
      if (result.success && result.work) {
        setWork(result.work);
      } else {
        throw new Error(result.error || 'Work not found');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseLicense = async (licenseType) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setPurchasing(true);
      
      const response = await fetch('/api/licenses/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          work_id: params.id,
          license_type: licenseType,
          payment_method: 'wallet' // Default to wallet payment
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to success page or show success message
        router.push(`/creator/licenses/${result.license.license_id}`);
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (err) {
      console.error(err);
      alert('Purchase failed: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

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

  if (!work) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-structural">Work not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title={work.title} 
          subtitle={`By ${work.creator_name || 'Unknown Creator'}`} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Work Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              {work.file_url && (
                <div className="mb-6">
                  <img 
                    src={work.file_url} 
                    alt={work.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-structural mb-2">{work.title}</h2>
                <p className="text-gray-600">{work.description}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Tag className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium text-structural">Category</div>
                  <div className="text-xs text-gray-500">{work.category}</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-secondary" />
                  <div className="text-sm font-medium text-structural">Created</div>
                  <div className="text-xs text-gray-500">
                    {new Date(work.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Download className="w-6 h-6 mx-auto mb-2 text-structural" />
                  <div className="text-sm font-medium text-structural">Downloads</div>
                  <div className="text-xs text-gray-500">{work.download_count || 0}</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium text-structural">Licenses</div>
                  <div className="text-xs text-gray-500">{work.license_count || 0}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* License Purchase */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-8">
              <h3 className="text-xl font-semibold text-structural mb-4">Purchase License</h3>
              
              {work.license_offerings?.map((offering) => (
                <div key={offering.offering_id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-structural">{offering.license_type}</h4>
                    <span className="text-lg font-bold text-secondary">
                      Rp {offering.price_idr.toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{offering.description}</p>
                  
                  <button
                    onClick={() => handlePurchaseLicense(offering.license_type)}
                    disabled={purchasing}
                    className="w-full bg-primary text-structural font-medium py-2 px-4 rounded-lg 
                             hover:opacity-90 transition-opacity disabled:opacity-50 
                             flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{purchasing ? 'Processing...' : 'Purchase License'}</span>
                  </button>
                </div>
              ))}
              
              {(!work.license_offerings || work.license_offerings.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No licenses available</div>
                  <div className="text-sm text-gray-500">
                    Contact the creator for licensing options
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
