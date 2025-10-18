"use client";
export default function LicenseCard({ license, onBuy, busy }){
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{license.title}</h3>
          <p className="text-sm text-gray-600">{license.description}</p>
        </div>
        <div className="text-right">
          <div className="font-medium">IDR {license.price_idr?.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{license.price_bidr?.toLocaleString()} BIDR</div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">{license.usage_limit && <div>Usage limit: {license.usage_limit}</div>}{license.duration_days && <div>Duration: {license.duration_days} days</div>}</div>
      <button onClick={()=>onBuy && onBuy(license)} disabled={busy} className="w-full bg-blue-600 text-white px-4 py-2 rounded">{busy? 'Processing...' : 'Buy License'}</button>
    </div>
  );
}
