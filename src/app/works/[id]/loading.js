/**
 * Loading state for work detail page
 * Displays while data is being fetched
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8">
            {/* Header Skeleton */}
            <div className="mb-4">
              <div className="h-9 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
            </div>
            
            {/* Category Badge Skeleton */}
            <div className="mb-6">
              <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
            </div>

            {/* Description Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded-md w-32 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-4/6 animate-pulse"></div>
              </div>
            </div>

            {/* File Display Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded-md w-20 mb-4 animate-pulse"></div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
                  {/* Loading Spinner */}
                  <div className="flex flex-col items-center">
                    <svg
                      className="animate-spin h-12 w-12 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="mt-4 text-gray-500 text-sm">Loading creative work...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Status Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded-md w-40 mb-3 animate-pulse"></div>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
                  <div className="h-5 bg-gray-300 rounded-md w-56 animate-pulse"></div>
                </div>
                <div className="mt-2 ml-8">
                  <div className="h-4 bg-gray-300 rounded-md w-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Metadata Skeleton */}
            <div className="border-t border-gray-200 pt-6">
              <div className="h-6 bg-gray-200 rounded-md w-28 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Metadata Item 1 */}
                <div>
                  <div className="h-4 bg-gray-200 rounded-md w-24 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                </div>
                {/* Metadata Item 2 */}
                <div>
                  <div className="h-4 bg-gray-200 rounded-md w-24 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                </div>
                {/* Metadata Item 3 */}
                <div>
                  <div className="h-4 bg-gray-200 rounded-md w-24 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-40 animate-pulse"></div>
                </div>
                {/* Metadata Item 4 */}
                <div>
                  <div className="h-4 bg-gray-200 rounded-md w-24 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-36 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
