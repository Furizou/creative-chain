"use client";

export default function LicenseCard({ license, onBuy }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-structural">
              {license.name}
            </h3>
            <p className="text-sm text-structural/60 mt-1">
              {license.description}
            </p>
          </div>
          <div className="text-2xl font-bold text-structural">
            ${license.price}
          </div>
        </div>

        <div className="space-y-2">
          {license.terms?.map((term, index) => (
            <div key={index} className="flex items-start space-x-2">
              <svg
                className="h-5 w-5 text-primary flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-structural">{term}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onBuy(license)}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
          Buy License
        </button>
      </div>
    </div>
  );
}
