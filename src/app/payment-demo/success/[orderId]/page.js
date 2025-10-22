'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.orderId;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              License Created Successfully!
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Payment confirmed for Order ID:
            </p>

            {/* Order ID Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-xl font-mono font-semibold text-gray-900 break-all">
                {orderId}
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <strong>License created successfully!</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Your license has been recorded in the database and is now being processed for blockchain minting.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  License record created
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Blockchain license minting (pending)
                </div>
                <div className="flex items-center text-gray-500">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  License delivery
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/licenses"
                className="w-full inline-block bg-secondary text-white py-3 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition duration-200 font-medium"
              >
                View My Licenses
              </Link>

              <Link
                href="/marketplace"
                className="w-full inline-block bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Go to Marketplace
              </Link>
            </div>
          </div>

          {/* Demo Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-yellow-50 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                🧪 <strong>Demo Complete:</strong> This completes the mock payment flow. The license has been created in the database and blockchain minting would be automatically triggered in production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}