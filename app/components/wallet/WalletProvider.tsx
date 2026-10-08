"use client";

import {
  getAddress,
  getNetworkDetails,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NETWORK_PASSPHRASE, type Signer } from "../../lib/contract";

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: Signer;
}

const WalletContext = createContext<WalletState | null>(null);

async function checkNetwork(): Promise<string | null> {
  const details = await getNetworkDetails();
  if (details.error) return details.error.message;
  if (details.networkPassphrase !== NETWORK_PASSPHRASE) {
    return "Switch Freighter to Testnet to use Inowo.";
  }
  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconnect silently if the user already granted this site access.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = await isAllowed();
      if (!allowed.isAllowed) return;
      const { address: existing } = await getAddress();
      if (!cancelled && existing) setAddress(existing);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const installed = await isConnected();
      if (!installed.isConnected) {
        setError("Install the Freighter wallet extension to continue.");
        return;
      }
      const access = await requestAccess();
      if (access.error) {
        setError(access.error.message);
        return;
      }
      const networkError = await checkNetwork();
      if (networkError) {
        setError(networkError);
        return;
      }
      setAddress(access.address);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const sign = useCallback<Signer>(
    async (txXdr) => {
      const networkError = await checkNetwork();
      if (networkError) throw new Error(networkError);
      const result = await signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: address ?? undefined,
      });
      if (result.error) throw new Error(result.error.message);
      return result.signedTxXdr;
    },
    [address]
  );

  return (
    <WalletContext.Provider
      value={{ address, connecting, error, connect, disconnect, sign }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("useWallet must be used inside <WalletProvider>");
  return wallet;
}
