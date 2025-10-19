'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentDemoPage() {
  const router = useRouter();
  const [licenseOfferingId, setLicenseOfferingId] = useState('008b8b96-ce81-494d-9c34-dec770ac9abc');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const handleStartPayment = async () => {
    setIsLoading(true);
    setApiResponse(null);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_offering_id: licenseOfferingId,
        }),
      });

      const data = await response.json();
      setApiResponse(data);

      if (data.success && data.paymentUrl) {
        // Auto-redirect to the payment processing page
        setTimeout(() => {
          router.push(data.paymentUrl);
        }, 2000); // 2 second delay to show the response
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setApiResponse({
        success: false,
        error: 'Network error occurred',
        details: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Payment Gateway Demo
          </h1>

          <div className="space-y-6">
            {/* License Offering ID Input */}
            <div>
              <label
                htmlFor="license-offering-id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                License Offering ID
              </label>
              <input
                id="license-offering-id"
                type="text"
                value={licenseOfferingId}
                onChange={(e) => setLicenseOfferingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter valid license offering ID from database"
              />
              <p className="mt-1 text-sm text-gray-500">
                The system will automatically fetch pricing from the license offering
              </p>
            </div>

            {/* Start Test Payment Button */}
            <button
              onClick={handleStartPayment}
              disabled={isLoading || !licenseOfferingId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? 'Processing...' : 'Start Test Payment'}
            </button>

            {/* API Response Display */}
            {apiResponse && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  API Response:
                </h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm border">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
                
                {apiResponse.success && apiResponse.paymentUrl && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">
                      ✅ Payment session created successfully!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Redirecting to payment page in 2 seconds...
                    </p>
                  </div>
                )}

                {!apiResponse.success && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">
                      ❌ Error: {apiResponse.error}
                    </p>
                    {apiResponse.details && (
                      <p className="text-red-700 text-sm mt-1">
                        Details: {apiResponse.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demo Instructions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-3">
              Demo Instructions:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Enter a valid license offering ID from the database</li>
              <li>Click "Start Test Payment" to create an order and payment session</li>
              <li>You'll be automatically redirected to the mock payment page</li>
              <li>Confirm the mock payment to complete the flow and update order status</li>
              <li>View the success page with order confirmation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}