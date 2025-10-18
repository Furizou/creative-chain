"use client";

export default function WorkDescription({ description, metadata }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h2 className="text-2xl font-bold text-structural mb-4">
        About this work
      </h2>
      
      <div className="prose prose-structural max-w-none">
        <p>{description}</p>
      </div>

      {metadata && (
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <dt className="font-medium text-structural/60">{key}</dt>
              <dd className="text-structural">{value}</dd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
