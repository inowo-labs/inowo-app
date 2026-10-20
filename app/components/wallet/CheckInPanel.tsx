"use client";

import { useState } from "react";
import { contractErrorCode, friendlyError, inowo, type Ticket } from "../../lib/contract";
import { formatUsdc, shortAddress } from "../../lib/format";
import ConnectButton from "./ConnectButton";
import { panelClass } from "./styles";
import { useWallet } from "./WalletProvider";

interface Props {
  eventId: number;
  organizer: string;
  tierNames: string[];
}

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; ticket: Ticket }
  | { status: "not-found" }
  | { status: "error"; message: string };

/** Shown right after a check-in attempt, replacing the ticket details until the next lookup. */
type Result = { kind: "admitted" } | { kind: "already-used" } | { kind: "error"; message: string };

export default function CheckInPanel({ eventId, organizer, tierNames }: Props) {
  const { address, sign } = useWallet();
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [result, setResult] = useState<Result | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  if (!address) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-slate-400 mb-4">
          Connect the organizer&apos;s wallet to check tickets in at the door.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (address !== organizer) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-slate-400">
          Only <span className="font-mono">{shortAddress(organizer)}</span>, this event&apos;s
          organizer, can check tickets in.
        </p>
      </div>
    );
  }

  async function lookUp(e: React.FormEvent) {
    e.preventDefault();
    const ticketId = Number(ticketIdInput);
    if (!/^\d+$/.test(ticketIdInput.trim())) return;

    setResult(null);
    setLookup({ status: "loading" });
    try {
      const ticket = await inowo.getTicket(eventId, ticketId);
      setLookup({ status: "found", ticket });
    } catch (err) {
      if (contractErrorCode(err) === 4) {
        setLookup({ status: "not-found" });
      } else {
        setLookup({ status: "error", message: friendlyError(err) });
      }
    }
  }

  async function checkIn() {
    if (lookup.status !== "found") return;
    const ticketId = Number(ticketIdInput);
    setRedeeming(true);
    try {
      await inowo.redeemTicket(organizer, eventId, ticketId, sign);
      setResult({ kind: "admitted" });
      setLookup({ status: "found", ticket: { ...lookup.ticket, redeemed: true } });
    } catch (err) {
      if (contractErrorCode(err) === 13) {
        setResult({ kind: "already-used" });
        setLookup({ status: "found", ticket: { ...lookup.ticket, redeemed: true } });
      } else {
        setResult({ kind: "error", message: friendlyError(err) });
      }
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className={panelClass}>
      <form onSubmit={lookUp} className="space-y-3">
        <label htmlFor="ticket-id" className="text-sm text-slate-400">
          Ticket ID
        </label>
        <div className="flex gap-2">
          <input
            id="ticket-id"
            inputMode="numeric"
            autoFocus
            placeholder="e.g. 0"
            value={ticketIdInput}
            onChange={(e) => {
              setTicketIdInput(e.target.value);
              setLookup({ status: "idle" });
              setResult(null);
            }}
            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-4 text-2xl text-center text-white focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={lookup.status === "loading" || !ticketIdInput.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium px-6 rounded-lg transition-colors"
          >
            Look up
          </button>
        </div>
      </form>

      {lookup.status === "loading" && <p className="text-slate-400 text-sm">Checking the chain…</p>}

      {lookup.status === "not-found" && (
        <Banner tone="red" title="NO SUCH TICKET" body={`There's no ticket #${ticketIdInput} for this event.`} />
      )}

      {lookup.status === "error" && <Banner tone="red" title="LOOKUP FAILED" body={lookup.message} />}

      {lookup.status === "found" && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tier</span>
              <span className="font-medium">{tierNames[lookup.ticket.tierIndex] ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Owner</span>
              <span className="font-mono">{shortAddress(lookup.ticket.owner)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Paid</span>
              <span className="font-mono">{formatUsdc(lookup.ticket.pricePaid)}</span>
            </div>
          </div>

          {result?.kind === "admitted" && <Banner tone="green" title="ADMITTED" body="Ticket checked in." />}
          {result?.kind === "already-used" && (
            <Banner tone="amber" title="ALREADY USED" body="This ticket was already checked in." />
          )}
          {result?.kind === "error" && <Banner tone="red" title="CHECK-IN FAILED" body={result.message} />}

          {!result &&
            (lookup.ticket.refunded ? (
              <Banner tone="amber" title="REFUNDED" body="This ticket's event was cancelled and refunded." />
            ) : lookup.ticket.redeemed ? (
              <Banner tone="amber" title="ALREADY USED" body="This ticket has already been checked in." />
            ) : null)}

          {!lookup.ticket.redeemed && !lookup.ticket.refunded && result?.kind !== "admitted" && (
            <button
              onClick={checkIn}
              disabled={redeeming}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xl font-bold py-5 rounded-xl transition-colors"
            >
              {redeeming ? "Checking in…" : "Check in"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Banner({
  tone,
  title,
  body,
}: {
  tone: "green" | "amber" | "red";
  title: string;
  body: string;
}) {
  const styles = {
    green: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    red: "bg-red-500/15 border-red-500/40 text-red-300",
  }[tone];
  return (
    <div className={`border rounded-xl p-5 text-center ${styles}`} role="status">
      <p className="text-2xl font-bold tracking-wide">{title}</p>
      <p className="text-sm mt-1 opacity-90">{body}</p>
    </div>
  );
}
