'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Format price to Indonesian Rupiah currency
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted IDR currency string
 */
const formatIDR = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'N/A';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numAmount);
};

export default function PaymentProcessPage({ params }) {
  const router = useRouter();
  const { orderId } = use(params);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch order details from API
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);

        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch order details');
        }

        if (result.success) {
          setOrderData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load order data');
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setDataError(err.message || 'Failed to load order details');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  // Using real database IDs from seed data for testing
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          status: 'success',
          work_id: '008b8b96-ce81-494d-9c34-dec770ac9abc', // Real work ID from seed data
          buyer_id: 'bc68b7b4-9435-4cf0-a72a-a7a3b339a56b', // Real buyer ID from seed data
          license_type: 'standard', // Mock license type
          price_bidr: 25.50, // Mock price in BIDR (changed from price_usdt)
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to success page
        router.push(`/payment-demo/success/${orderId}`);
      } else {
        setError(data.error || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Network error occurred while confirming payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm Mock Payment
            </h1>
            
            <p className="text-gray-600 mb-6">
              This is a simulated payment confirmation page
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Order Details
            </h3>
            {isLoadingData ? (
              <div className="animate-pulse space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
            ) : dataError ? (
              <div className="text-center text-red-600 text-sm py-2">
                {dataError}
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-900">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="text-gray-900 font-semibold">
                    {orderData ? formatIDR(orderData.amount_idr) : 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    orderData?.status === 'paid' 
                      ? 'text-green-600' 
                      : orderData?.status === 'pending' 
                      ? 'text-yellow-600' 
                      : 'text-gray-600'
                  }`}>
                    {orderData?.status ? 
                      orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1) + 
                      (orderData.status === 'pending' ? ' Payment' : '') 
                      : 'Loading...'
                    }
                  </span>
                </div>
                {orderData?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">
                      {new Date(orderData.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={isLoading || isLoadingData || dataError || !orderData}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Confirm Payment'
            )}
          </button>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/payment-demo')}
              className="text-sm text-gray-600 hover:text-gray-900 transition duration-200"
            >
              ← Back to Demo Home
            </button>
          </div>

          {/* Mock Payment Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-md p-3">
              <p className="text-xs text-blue-800">
                🧪 <strong>Mock Payment:</strong> This is a simulation. Clicking "Confirm Payment" will trigger the webhook and create a license record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}