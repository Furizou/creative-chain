"use client";

export default function CopyrightBadge({ certificateUrl, transactionHash }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-structural" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-structural">
            Verified on Blockchain
          </h3>
          <p className="text-sm text-structural/60 mt-1">
            This work is protected with blockchain certification
          </p>
        </div>

        <div className="flex-shrink-0">
          <a
            href={`https://polygonscan.com/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            View on Polygonscan
          </a>
        </div>
      </div>

      {certificateUrl && (
        <div className="mt-4">
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-secondary/90 text-sm font-medium"
          >
            View Certificate →
          </a>
        </div>
      )}
    </div>
  );
}
