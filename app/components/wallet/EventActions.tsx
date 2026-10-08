"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  friendlyError,
  inowo,
  parseUsdc,
  txUrl,
  type InvokeResult,
} from "../../lib/contract";
import { formatUsdc } from "../../lib/format";
import type { EventStatus, TicketTier } from "../../lib/types";
import ConnectButton from "./ConnectButton";
import { useWallet } from "./WalletProvider";

interface Props {
  eventId: number;
  status: EventStatus;
  tiers: TicketTier[];
}

type Outcome = { ok: true; message: string; hash: string } | { ok: false; message: string };

export default function EventActions({ eventId, status, tiers }: Props) {
  const { address, sign } = useWallet();
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
    } catch (err) {
      setOutcome({ ok: false, message: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  if (status === "Ended") return null;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-6">
      <h2 className="font-semibold">
        {status === "Active" ? "Get involved" : "Refunds"}
      </h2>

      {!address ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            {status === "Active"
              ? "Connect a Stellar testnet wallet to sponsor this event or buy a ticket."
              : "Connect the wallet you sponsored with to claim your refund."}
          </p>
          <ConnectButton />
        </div>
      ) : status === "Active" ? (
        <>
          <SponsorForm
            busy={busy}
            onSubmit={(amount) =>
              run(
                () => inowo.sponsorEvent(address, eventId, amount, sign),
                `Sponsored ${formatUsdc(amount)}.`
              )
            }
          />
          <BuyTicketForm
            busy={busy}
            tiers={tiers}
            onSubmit={(tierIndex) =>
              run(
                () => inowo.buyTicket(address, eventId, tierIndex, sign),
                `Ticket purchased: ${tiers[tierIndex].name}.`
              )
            }
          />
        </>
      ) : (
        <RefundPanel
          eventId={eventId}
          address={address}
          busy={busy}
          refreshKey={outcome}
          onClaim={() =>
            run(
              () => inowo.refundSponsorship(address, eventId, sign),
              "Your sponsorship was refunded."
            )
          }
        />
      )}

      {outcome && (
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
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500";
const buttonClass =
  "w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors";

function SponsorForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (amount: bigint) => void;
}) {
  const [input, setInput] = useState("");
  const amount = parseUsdc(input);
  const valid = amount !== null && amount > BigInt(0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(amount);
      }}
      className="space-y-2"
    >
      <label htmlFor="sponsor-amount" className="text-sm text-slate-400">
        Sponsor amount (USDC)
      </label>
      <input
        id="sponsor-amount"
        inputMode="decimal"
        placeholder="e.g. 5"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={busy || !valid} className={buttonClass}>
        {busy ? "Waiting for confirmation…" : "Sponsor"}
      </button>
    </form>
  );
}

function BuyTicketForm({
  busy,
  tiers,
  onSubmit,
}: {
  busy: boolean;
  tiers: TicketTier[];
  onSubmit: (tierIndex: number) => void;
}) {
  const firstAvailable = tiers.findIndex((t) => t.tickets_sold < t.supply_cap);
  const [tierIndex, setTierIndex] = useState(Math.max(firstAvailable, 0));
  const tier = tiers[tierIndex];
  const soldOut = !tier || tier.tickets_sold >= tier.supply_cap;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!soldOut) onSubmit(tierIndex);
      }}
      className="space-y-2"
    >
      <label htmlFor="ticket-tier" className="text-sm text-slate-400">
        Ticket
      </label>
      <select
        id="ticket-tier"
        value={tierIndex}
        onChange={(e) => setTierIndex(Number(e.target.value))}
        className={inputClass}
      >
        {tiers.map((t, i) => (
          <option key={t.name} value={i} disabled={t.tickets_sold >= t.supply_cap}>
            {t.name} — {formatUsdc(t.price)}
            {t.tickets_sold >= t.supply_cap ? " (sold out)" : ""}
          </option>
        ))}
      </select>
      <button type="submit" disabled={busy || soldOut} className={buttonClass}>
        {busy ? "Waiting for confirmation…" : soldOut ? "Sold out" : "Buy ticket"}
      </button>
    </form>
  );
}

function RefundPanel({
  eventId,
  address,
  busy,
  refreshKey,
  onClaim,
}: {
  eventId: number;
  address: string;
  busy: boolean;
  refreshKey: unknown;
  onClaim: () => void;
}) {
  const [owed, setOwed] = useState<bigint | null>(null);

  useEffect(() => {
    let cancelled = false;
    inowo
      .sponsorTotal(eventId, address)
      .then((total) => !cancelled && setOwed(total))
      .catch(() => !cancelled && setOwed(BigInt(0)));
    return () => {
      cancelled = true;
    };
  }, [eventId, address, refreshKey]);

  if (owed === null) {
    return <p className="text-sm text-slate-400">Checking your sponsorship…</p>;
  }
  if (owed === BigInt(0)) {
    return (
      <p className="text-sm text-slate-400">
        This wallet has no sponsorship left to refund for this event.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">
        You are owed <span className="font-mono">{formatUsdc(owed)}</span>.
      </p>
      <button onClick={onClaim} disabled={busy} className={buttonClass}>
        {busy ? "Waiting for confirmation…" : "Claim refund"}
      </button>
    </div>
  );
}
