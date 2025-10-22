"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { Download, Calendar, DollarSign, FileText, ExternalLink } from 'lucide-react';

export default function LicensesPage() {
  const { user, loading: authLoading } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchLicenses();
    }
  }, [user, authLoading]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/licenses/purchase?action=list', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLicenses(result.licenses || []);
      } else {
        throw new Error(result.error || 'Failed to fetch licenses');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (licenseId) => {
    try {
      const response = await fetch(`/api/licenses/${licenseId}/certificate`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to download certificate');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-certificate-${licenseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to download certificate: ' + err.message);
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

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Your Licenses" subtitle="Manage and download your purchased licenses" />
        
        {licenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {licenses.map((license) => (
              <div key={license.license_id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-structural mb-1">{license.work_title}</h3>
                    <span className="inline-block px-2 py-1 bg-primary text-structural text-xs font-medium rounded">
                      {license.license_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-structural">
                      Rp {(license.purchase_price_idr || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Purchased: {new Date(license.created_at).toLocaleDateString()}
                  </div>
                  
                  {license.blockchain_hash && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span className="truncate">Blockchain: {license.blockchain_hash.substring(0, 20)}...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadCertificate(license.license_id)}
                    className="flex-1 bg-structural text-white py-2 px-3 rounded-lg text-sm font-medium 
                             hover:opacity-90 transition-opacity flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Certificate</span>
                  </button>
                  
                  <button
                    onClick={() => window.open(`/marketplace/${license.work_id}`, '_blank')}
                    className="flex-1 border border-structural text-structural py-2 px-3 rounded-lg text-sm font-medium 
                             hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Work</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-structural mb-2">No licenses yet</h3>
            <p className="text-gray-500 mb-4">
              Browse the marketplace to purchase your first license.
            </p>
            <a
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-primary text-structural font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Marketplace
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
