"use client";

import { shortAddress } from "../../lib/format";
import { useWallet } from "./WalletProvider";

export default function ConnectButton() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        title={`${address} — click to disconnect`}
        className="text-sm font-mono border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
      >
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span role="alert" className="hidden md:inline text-xs text-red-400 max-w-xs">
          {error}
        </span>
      )}
      <button
        onClick={connect}
        disabled={connecting}
        className="text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-medium rounded-lg px-3 py-1.5 transition-colors"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
    </div>
  );
}
