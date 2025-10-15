"use client";

import { useActiveAccount } from "thirdweb/react";

export default function WalletInfo() {
  const account = useActiveAccount();

  if (!account) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">No wallet connected</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="font-semibold mb-2">Connected Wallet</h3>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Address:</span> {account.address}
      </p>
    </div>
  );
}
