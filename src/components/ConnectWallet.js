"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb/client";

export default function ConnectWallet() {
  return (
    <div>
      <ConnectButton client={client} />
    </div>
  );
}
