"use client";

import { useState } from "react";
import {
  MAX_MEMO_BYTES,
  inowo,
  isStellarAddress,
  memoBytes,
  parseUsdc,
} from "../../lib/contract";
import { formatUsdc } from "../../lib/format";
import type { EventStatus } from "../../lib/types";
import { buttonClass, inputClass, panelClass } from "./styles";
import { TxOutcome, useTransaction } from "./useTransaction";
import { useWallet } from "./WalletProvider";

interface Props {
  eventId: number;
  status: EventStatus;
  organizer: string;
  /** Escrow balance in stroops. */
  balance: string;
}

type Pending = "end" | "cancel" | null;

const CONFIRMATIONS: Record<"end" | "cancel", { title: string; body: string; action: string }> = {
  end: {
    title: "End this event?",
    body: "Ticket sales and sponsorships stop, and you can start releasing escrowed funds to recipients. The event can no longer be cancelled.",
    action: "End event",
  },
  cancel: {
    title: "Cancel this event?",
    body: "Sales and sponsorships stop, and every sponsor and ticket holder can claim a full refund. No funds can ever be released. This cannot be undone.",
    action: "Cancel event",
  },
};

export default function OrganizerPanel({ eventId, status, organizer, balance }: Props) {
  const { address, sign } = useWallet();
  const { busy, outcome, run } = useTransaction();
  const [pending, setPending] = useState<Pending>(null);

  if (address !== organizer || status === "Cancelled") return null;

  async function confirm(action: "end" | "cancel") {
    const ok = await run(
      () =>
        action === "end"
          ? inowo.endEvent(organizer, eventId, sign)
          : inowo.cancelEvent(organizer, eventId, sign),
      action === "end" ? "Event ended. You can now release funds." : "Event cancelled. Refunds are open."
    );
    if (ok) setPending(null);
  }

  return (
    <div className={`${panelClass} border-violet-500/30`}>
      <div>
        <h2 className="font-semibold">Organizer</h2>
        <p className="text-xs text-slate-500 mt-1">Only you can see these controls.</p>
      </div>

      {status === "Active" &&
        (pending ? (
          <div className="space-y-3" role="alertdialog" aria-labelledby="organizer-confirm-title">
            <p id="organizer-confirm-title" className="font-medium">
              {CONFIRMATIONS[pending].title}
            </p>
            <p className="text-sm text-slate-400">{CONFIRMATIONS[pending].body}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPending(null)}
                disabled={busy}
                className="flex-1 border border-white/15 hover:border-white/30 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => confirm(pending)}
                disabled={busy}
                className={`flex-1 ${
                  pending === "cancel" ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"
                } disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors`}
              >
                {busy ? "Waiting…" : CONFIRMATIONS[pending].action}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setPending("end")} className={buttonClass}>
              End event
            </button>
            <button
              onClick={() => setPending("cancel")}
              className="w-full border border-red-500/40 hover:border-red-500/70 text-red-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Cancel event
            </button>
          </div>
        ))}

      {status === "Ended" && (
        <ReleaseForm
          balance={BigInt(balance)}
          busy={busy}
          onSubmit={(recipient, amount, memo) =>
            run(
              () => inowo.releaseFunds(organizer, eventId, recipient, amount, memo, sign),
              `Released ${formatUsdc(amount)} — ${memo}.`
            )
          }
        />
      )}

      <TxOutcome outcome={outcome} />
    </div>
  );
}

function ReleaseForm({
  balance,
  busy,
  onSubmit,
}: {
  balance: bigint;
  busy: boolean;
  onSubmit: (recipient: string, amount: bigint, memo: string) => Promise<boolean>;
}) {
  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");

  const amount = parseUsdc(amountInput);
  const bytes = memoBytes(memo.trim());
  const errors = {
    recipient: recipient && !isStellarAddress(recipient) ? "Enter a valid Stellar address (G…)." : null,
    amount:
      amountInput && (amount === null || amount <= BigInt(0))
        ? "Enter a positive USDC amount."
        : amount !== null && amount > balance
          ? `Only ${formatUsdc(balance)} is in escrow.`
          : null,
    memo: bytes > MAX_MEMO_BYTES ? `Memo is ${bytes} bytes; the limit is ${MAX_MEMO_BYTES}.` : null,
  };
  const valid =
    isStellarAddress(recipient) &&
    amount !== null &&
    amount > BigInt(0) &&
    amount <= balance &&
    bytes > 0 &&
    bytes <= MAX_MEMO_BYTES;

  if (balance === BigInt(0)) {
    return <p className="text-sm text-slate-400">All escrowed funds have been released.</p>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || amount === null) return;
        if (await onSubmit(recipient.trim(), amount, memo.trim())) {
          setRecipient("");
          setAmountInput("");
          setMemo("");
        }
      }}
      className="space-y-3"
    >
      <p className="text-sm text-slate-400">
        Release funds to a recipient. Each payout is public, with its memo, next to every
        contribution. {formatUsdc(balance)} in escrow.
      </p>

      <Field id="release-recipient" label="Recipient address" error={errors.recipient}>
        <input
          id="release-recipient"
          placeholder="G…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className={`${inputClass} font-mono`}
          spellCheck={false}
        />
      </Field>

      <Field id="release-amount" label="Amount (USDC)" error={errors.amount}>
        <input
          id="release-amount"
          inputMode="decimal"
          placeholder="e.g. 2.5"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        id="release-memo"
        label="What is this payment for?"
        error={errors.memo}
        hint={`${bytes} / ${MAX_MEMO_BYTES} bytes`}
      >
        <input
          id="release-memo"
          placeholder="e.g. Sound crew"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={busy || !valid} className={buttonClass}>
        {busy ? "Waiting for confirmation…" : "Release funds"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="text-slate-400">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
