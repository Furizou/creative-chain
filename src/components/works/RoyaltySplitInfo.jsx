"use client";

export default function RoyaltySplitInfo({ splits }) {
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h2 className="text-2xl font-bold text-structural mb-6">
        Royalty Distribution
      </h2>

      <div className="space-y-6">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-structural bg-primary">
                Total Distribution: {totalPercentage}%
              </span>
            </div>
          </div>
          <div className="flex h-4 mb-4 rounded-full overflow-hidden">
            {splits.map((split, index) => (
              <div
                key={split.id}
                style={{ width: `${split.percentage}%` }}
                className={`
                  flex flex-col text-center whitespace-nowrap text-white justify-center
                  ${index % 2 === 0 ? 'bg-primary' : 'bg-secondary'}
                `}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {splits.map((split) => (
            <div
              key={split.id}
              className="flex items-center p-4 rounded-lg bg-base"
            >
              <div className="flex-shrink-0">
                {split.avatar ? (
                  <img
                    src={split.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-structural text-sm font-medium">
                      {split.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="text-sm font-medium text-structural">
                  {split.name}
                </div>
                <div className="text-sm text-structural/60">
                  {split.role || 'Contributor'}
                </div>
              </div>
              <div className="text-lg font-semibold text-structural">
                {split.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
