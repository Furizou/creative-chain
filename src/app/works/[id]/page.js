'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { createDemoLicenseOffering } from '@/app/actions';

/**
 * Client Component to display creative work details with license offerings
 * @param {Object} props - Component props
 * @param {Object} props.params - Dynamic route parameters
 * @param {string} props.params.id - Work ID from the URL
 * @returns {JSX.Element} Work details page
 */
export default function WorkDetailsPage({ params }) {
  const router = useRouter();
  const [work, setWork] = useState(null);
  const [licenseOfferings, setLicenseOfferings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [workId, setWorkId] = useState(null);

  // Extract work ID from params
  useEffect(() => {
    const getWorkId = async () => {
      const resolvedParams = await params;
      setWorkId(resolvedParams.id);
    };
    getWorkId();
  }, [params]);

  // Fetch work and license offerings data
  useEffect(() => {
    if (!workId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch work details and license offerings in parallel
        const [workResponse, licensesResponse] = await Promise.all([
          supabase
            .from('creative_works')
            .select('*')
            .eq('id', workId)
            .single(),
          supabase
            .from('license_offerings')
            .select('*')
            .eq('work_id', workId)
            .order('created_at', { ascending: false })
        ]);

        // Handle work data
        if (workResponse.error) {
          if (workResponse.error.code === 'PGRST116') {
            router.push('/404');
            return;
          }
          throw workResponse.error;
        }

        if (!workResponse.data) {
          router.push('/404');
          return;
        }

        // Handle license offerings data
        if (licensesResponse.error) {
          console.warn('Error fetching license offerings:', licensesResponse.error);
          // Don't fail the entire page for license offerings errors
        }

        setWork(workResponse.data);
        setLicenseOfferings(licensesResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load work details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workId, router]);

  // Handle demo license creation
  const handleCreateDemoLicense = async () => {
    if (!workId || isCreatingDemo) return;

    try {
      setIsCreatingDemo(true);
      const result = await createDemoLicenseOffering(workId);
      
      if (result.success) {
        // Refresh license offerings
        const { data: updatedLicenses } = await supabase
          .from('license_offerings')
          .select('*')
          .eq('work_id', workId)
          .order('created_at', { ascending: false });
        
        setLicenseOfferings(updatedLicenses || []);
      } else {
        setError(result.error || 'Failed to create demo license');
      }
    } catch (err) {
      console.error('Error creating demo license:', err);
      setError('Failed to create demo license');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-96 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Work</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if the file is an image based on file extension
  const isImage = work?.file_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(work.file_url);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {work.title}
              </h1>
              
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {work.category}
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {work.description || 'No description provided.'}
                </p>
              </div>

              {/* File Display */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">File</h2>
                {work.file_url ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {isImage ? (
                      <div className="relative">
                        <img
                          src={work.file_url}
                          alt={work.title}
                          className="w-full h-auto max-h-96 object-contain bg-gray-50"
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mb-4">
                          <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-700 mb-4">
                          File: {work.original_filename || 'Unknown filename'}
                        </p>
                        <a
                          href={work.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    No file associated with this work.
                  </div>
                )}
              </div>

              {/* Certificate Status */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Certificate Status</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-yellow-400 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-yellow-800 font-medium">
                      Certificate Status: Not Yet Minted
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    This work has not yet been minted as a blockchain certificate.
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Hash</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {work.file_hash || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.file_size ? `${(work.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.created_at ? new Date(work.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Original Filename</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.original_filename || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* License Offerings Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Available Licenses
                  </h2>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleCreateDemoLicense}
                      disabled={isCreatingDemo}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingDemo ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Demo License'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-6">
                {licenseOfferings && licenseOfferings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {licenseOfferings.map((license) => (
                      <div
                        key={license.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-gray-900">
                            {license.license_type || 'Standard License'}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 roundFed-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatPrice(license.price_idr)}
                          </p>
                          {license.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {license.description}
                            </p>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mb-4 space-y-1">
                          <div>Created: {new Date(license.created_at).toLocaleDateString()}</div>
                          {license.valid_until && (
                            <div>Valid until: {new Date(license.valid_until).toLocaleDateString()}</div>
                          )}
                        </div>

                        <button
                          onClick={() => router.push(`/works/${workId}/checkout?license_id=${license.id}`)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Buy Now
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-gray-900">No licenses available</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      There are currently no license offerings for this work.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4">
                        <button
                          onClick={handleCreateDemoLicense}
                          disabled={isCreatingDemo}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {isCreatingDemo ? 'Creating...' : 'Create Demo License'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}