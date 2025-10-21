'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Format price for display in Indonesian Rupiah
 * @param {string|number} price - Price value
 * @returns {string} Formatted price string
 */
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'N/A';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numPrice);
};

/**
 * Checkout page content component (wrapped in Suspense boundary)
 */
function CheckoutPageContent({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [workId, setWorkId] = useState(null);
  const [licenseOfferingId, setLicenseOfferingId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [workData, setWorkData] = useState(null);
  const [licenseOffering, setLicenseOffering] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Extract IDs from URL parameters
  useEffect(() => {
    if (!isMounted) return;
    const getParams = async () => {
      const resolvedParams = await params;
      const workIdFromParams = resolvedParams.id;
      const licenseIdFromQuery = searchParams.get('license_id'); // Fixed: was 'license'

      if (!workIdFromParams || !licenseIdFromQuery) {
        setError('Missing required parameters: work ID or license offering ID');
        setIsLoading(false);
        return;
      }

      setWorkId(workIdFromParams);
      setLicenseOfferingId(licenseIdFromQuery);
    };

    getParams();
  }, [params, searchParams, isMounted]);

  // Fetch work and license offering data
  useEffect(() => {
    if (!workId || !licenseOfferingId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both work and license offering data in parallel
        const [workResponse, licenseResponse] = await Promise.all([
          supabase
            .from('creative_works')
            .select('*')
            .eq('id', workId)
            .single(),
          supabase
            .from('license_offerings')
            .select('*')
            .eq('id', licenseOfferingId)
            .single()
        ]);

        // Handle work data
        if (workResponse.error) {
          if (workResponse.error.code === 'PGRST116') {
            throw new Error('Work not found');
          }
          throw workResponse.error;
        }

        // Handle license offering data
        if (licenseResponse.error) {
          if (licenseResponse.error.code === 'PGRST116') {
            throw new Error('License offering not found');
          }
          throw licenseResponse.error;
        }

        setWorkData(workResponse.data);
        setLicenseOffering(licenseResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load checkout data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workId, licenseOfferingId]);

  // Handle payment initiation
  const handleConfirmPayment = async () => {
    if (!licenseOfferingId || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Call payment initiation endpoint
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_offering_id: licenseOfferingId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      if (result.success && result.paymentUrl) {
        // Redirect to payment page
        router.push(result.paymentUrl);
      } else {
        throw new Error('Invalid response from payment API');
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err.message || 'Failed to start payment process');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="mt-8 h-12 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !workData && !licenseOffering) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Checkout</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-8 py-6">
            <h1 className="text-3xl font-bold">Confirm Your Order</h1>
            <p className="text-blue-100 mt-2">Review your purchase before proceeding to payment</p>
          </div>

          {/* Order Summary */}
          <div className="px-8 py-6">
            {/* Creative Work Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Creative Work</h2>
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {workData?.title || 'Loading work title...'}
                </h3>
                {workData?.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {workData.description}
                  </p>
                )}
                {workData?.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {workData.category}
                  </span>
                )}
              </div>
            </div>

            {/* License Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">License Details</h2>
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {licenseOffering?.title || 'Loading license title...'}
                </h3>
                {licenseOffering?.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {licenseOffering.description}
                  </p>
                )}
                
                {/* Price Display */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">License Price:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {licenseOffering?.price_idr ? formatPrice(licenseOffering.price_idr) : 'Loading...'}
                  </span>
                </div>
                
                {licenseOffering?.price_bidr && (
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>Base IDR Price:</span>
                    <span>{formatPrice(licenseOffering.price_bidr)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing || !workData || !licenseOffering}
                className="flex-2 bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Confirm and Proceed to Payment'
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              By proceeding to payment, you agree to our Terms of Service and License Agreement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout page wrapper with Suspense boundary
 * @param {Object} props - Component props
 * @param {Object} props.params - Dynamic route parameters
 * @returns {JSX.Element} Checkout page component
 */
export default function CheckoutPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
                <div className="mt-8 h-12 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutPageContent params={params} />
    </Suspense>
  );
}