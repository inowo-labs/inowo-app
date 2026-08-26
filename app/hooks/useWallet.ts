"use client";

import { useState, useEffect } from "react";

/**
 * Reads the connected Freighter wallet address from the browser.
 *
 * Returns `null` when:
 *   - the wallet is not connected, or
 *   - Freighter is not installed, or
 *   - the component is still mounting (server-side).
 *
 * When Freighter wallet integration lands (issue #1) this hook will call
 * `window.freighter.getPublicKey()` directly. Until then it reads from
 * `localStorage` under the key `"walletAddress"` so the UI and tests can
 * exercise all three states without a real extension installed.
 */
export function useWallet(): { address: string | null; loading: boolean } {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO(issue #1): replace with window.freighter.getPublicKey() once
    // Freighter wallet connection is implemented.
    const stored = localStorage.getItem("walletAddress");
    setAddress(stored ?? null);
    setLoading(false);
  }, []);

  return { address, loading };
}
