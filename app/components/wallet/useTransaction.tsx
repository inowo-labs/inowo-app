"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { friendlyError, txUrl, type InvokeResult } from "../../lib/contract";

export type Outcome =
  | { ok: true; message: string; hash: string }
  | { ok: false; message: string };

/**
 * Runs a contract transaction, tracks its pending state, and re-reads the
 * page's server data once it confirms.
 */
export function useTransaction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function run(action: () => Promise<InvokeResult>, success: string) {
    setBusy(true);
    setOutcome(null);
    try {
      const { hash } = await action();
      setOutcome({ ok: true, message: success, hash });
      router.refresh();
      return true;
    } catch (err) {
      setOutcome({ ok: false, message: friendlyError(err) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, outcome, run };
}

export function TxOutcome({ outcome }: { outcome: Outcome | null }) {
  if (!outcome) return null;
  return (
    <p
      role="status"
      className={`text-sm ${outcome.ok ? "text-emerald-400" : "text-red-400"}`}
    >
      {outcome.message}{" "}
      {outcome.ok && (
        <a
          href={txUrl(outcome.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-emerald-300"
        >
          View transaction ↗
        </a>
      )}
    </p>
  );
}
