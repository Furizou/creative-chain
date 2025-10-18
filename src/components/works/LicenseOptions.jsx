"use client";

import LicenseCard from './LicenseCard';

export default function LicenseOptions({ licenses, onBuyLicense }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h2 className="text-2xl font-bold text-structural mb-6">
        Available Licenses
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {licenses.map((license) => (
          <LicenseCard
            key={license.id}
            license={license}
            onBuy={onBuyLicense}
          />
        ))}
      </div>
    </div>
  );
}
