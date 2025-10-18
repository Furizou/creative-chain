"use client";

export default function TransactionLedger({ transactions }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h2 className="text-2xl font-bold text-structural mb-6">
        Transaction History
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-structural/60 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-structural/60 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-structural/60 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-structural/60 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-structural/60 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-structural">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-structural">
                  {transaction.licenseName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {transaction.buyer.avatar && (
                      <img
                        src={transaction.buyer.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    )}
                    <span className="text-sm text-structural">
                      {transaction.buyer.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-structural">
                  ${transaction.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    `}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
