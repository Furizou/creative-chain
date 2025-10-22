'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

/**
 * My Licenses Page
 * Displays all licenses purchased by the authenticated user
 * Includes NFT details and license information
 */
export default function MyLicensesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLicenses();
    }
  }, [isAuthenticated, user]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/licenses/my-licenses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch licenses');
      }

      setLicenses(data.data || []);
    } catch (err) {
      console.error('Error fetching licenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (priceBidr) => {
    if (!priceBidr) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(priceBidr);
  };

  const getLicenseTypeLabel = (type) => {
    const labels = {
      personal: 'Personal Use',
      commercial_event: 'Commercial Event',
      broadcast_1year: 'Broadcast (1 Year)',
      exclusive: 'Exclusive Rights'
    };
    return labels[type] || type;
  };

  const getLicenseStatusBadge = (license) => {
    if (!license.is_valid) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning text-white">Invalid</span>;
    }

    if (license.expires_at) {
      const expiryDate = new Date(license.expires_at);
      const now = new Date();
      if (expiryDate < now) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning text-white">Expired</span>;
      }
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-structural">Active</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-base py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-structural mb-2">
            My Licenses
          </h1>
          <p className="text-structural">
            View and manage all your purchased licenses and their NFT details
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white border-2 border-warning rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-warning mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-warning">Error Loading Licenses</h3>
                <p className="text-sm text-structural mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && licenses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-structural mb-2">No Licenses Yet</h3>
            <p className="text-structural mb-6">
              You haven't purchased any licenses yet. Browse the marketplace to get started!
            </p>
            <Link href="/marketplace">
              <button className="bg-primary text-structural px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Browse Marketplace
              </button>
            </Link>
          </div>
        )}

        {/* Licenses Grid */}
        {!error && licenses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {licenses.map((license) => (
              <div key={license.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* License Header */}
                <div className="px-6 py-4 bg-gradient-to-br from-primary to-secondary">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-structural">
                        {getLicenseTypeLabel(license.license_type)}
                      </h3>
                      <p className="text-xs text-structural opacity-80 mt-1">
                        License #{license.id.slice(0, 8)}
                      </p>
                    </div>
                    {getLicenseStatusBadge(license)}
                  </div>
                </div>

                {/* License Details */}
                <div className="px-6 py-4">
                  <dl className="space-y-3">
                    {/* Work Title */}
                    {license.work_title && (
                      <div>
                        <dt className="text-xs font-medium text-structural opacity-60">Work</dt>
                        <dd className="mt-0.5 text-sm text-structural font-semibold">
                          {license.work_title}
                        </dd>
                      </div>
                    )}

                    {/* Price */}
                    <div>
                      <dt className="text-xs font-medium text-structural opacity-60">Price Paid</dt>
                      <dd className="mt-0.5 text-sm text-structural font-semibold">
                        {formatPrice(license.price_bidr)}
                      </dd>
                    </div>

                    {/* Purchase Date */}
                    <div>
                      <dt className="text-xs font-medium text-structural opacity-60">Purchased</dt>
                      <dd className="mt-0.5 text-sm text-structural">
                        {formatDate(license.purchased_at)}
                      </dd>
                    </div>

                    {/* Expiry */}
                    {license.expires_at && (
                      <div>
                        <dt className="text-xs font-medium text-structural opacity-60">Expires</dt>
                        <dd className="mt-0.5 text-sm text-structural">
                          {formatDate(license.expires_at)}
                        </dd>
                      </div>
                    )}

                    {/* Usage */}
                    {license.usage_limit && (
                      <div>
                        <dt className="text-xs font-medium text-structural opacity-60">Usage</dt>
                        <dd className="mt-0.5 text-sm text-structural">
                          {license.usage_count || 0} / {license.usage_limit}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* NFT Details */}
                {license.nft_token_id && (
                  <div className="px-6 py-4 bg-base border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-structural mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      NFT Details
                    </h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-medium text-structural opacity-60">Token ID</dt>
                        <dd className="mt-0.5 text-xs text-structural font-mono break-all">
                          {license.nft_token_id}
                        </dd>
                      </div>
                      {license.wallet_address && (
                        <div>
                          <dt className="text-xs font-medium text-structural opacity-60">Wallet Address</dt>
                          <dd className="mt-0.5 text-xs text-structural font-mono break-all">
                            {license.wallet_address}
                          </dd>
                        </div>
                      )}
                      {license.nft_transaction_hash && (
                        <div>
                          <dt className="text-xs font-medium text-structural opacity-60">Transaction Hash</dt>
                          <dd className="mt-0.5 text-xs text-structural font-mono break-all">
                            {license.nft_transaction_hash.slice(0, 20)}...
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-2">
                  {license.nft_transaction_hash && (
                    <Link href={`/verify?txHash=${license.nft_transaction_hash}`} className="flex-1">
                      <button className="w-full bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-opacity">
                        Verify NFT
                      </button>
                    </Link>
                  )}
                  {license.work_id && (
                    <Link href={`/marketplace/${license.work_id}`} className="flex-1">
                      <button className="w-full border border-gray-300 text-structural px-4 py-2 rounded-md text-sm font-medium hover:bg-base transition-colors">
                        View Work
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        {licenses.length > 0 && (
          <div className="mt-8 bg-white border-2 border-primary rounded-lg p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-secondary mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-structural mb-2">About Your Licenses</h3>
                <ul className="text-sm text-structural space-y-1 list-disc list-inside">
                  <li>All licenses are backed by blockchain NFTs for authenticity</li>
                  <li>You can verify any license on the blockchain using the "Verify NFT" button</li>
                  <li>License terms and usage limits are enforced automatically</li>
                  <li>Your NFT wallet address is stored securely and managed by the platform</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
