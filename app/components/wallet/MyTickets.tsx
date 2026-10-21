"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { friendlyError, inowo, type Ticket } from "../../lib/contract";
import { formatUsdc } from "../../lib/format";
import type { EventStatus } from "../../lib/types";
import ConnectButton from "./ConnectButton";
import { buttonClass, panelClass } from "./styles";
import { useWallet } from "./WalletProvider";

interface OwnedTicket {
  eventId: number;
  eventName: string;
  eventStatus: EventStatus;
  ticketId: number;
  tierName: string;
  ticket: Ticket;
}

type RefundOutcome = { ok: boolean; message: string };

/**
 * Scans every event for tickets this wallet owns. There is no efficient
 * "tickets by owner" lookup live on testnet yet (inowo-Contract#35 adds one,
 * not yet deployed), so this reads every ticket of every event directly from
 * the contract and filters client-side. Fine for the handful of events and
 * tickets on testnet today; once #35 is deployed this becomes a single call.
 */
export default function MyTickets() {
  const { address, sign } = useWallet();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<OwnedTicket[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, RefundOutcome>>({});

  const scan = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setScanError(null);
    try {
      const events = await api.events();
      const found: OwnedTicket[] = [];

      for (const event of events) {
        const [count, tiers] = await Promise.all([
          api.ticketCount(event.id),
          api.tiers(event.id),
        ]);
        for (let ticketId = 0; ticketId < count; ticketId++) {
          try {
            const ticket = await inowo.getTicket(event.id, ticketId);
            if (ticket.owner === address) {
              found.push({
                eventId: event.id,
                eventName: event.name,
                eventStatus: event.status,
                ticketId,
                tierName: tiers[ticket.tierIndex]?.name ?? "—",
                ticket,
              });
            }
          } catch {
            // A single flaky read shouldn't fail the whole scan; skip it.
          }
        }
      }
      setTickets(found);
    } catch (err) {
      setScanError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      void scan();
    } else {
      setTickets([]);
      setLoading(false);
    }
  }, [address, scan]);

  async function claimRefund(eventId: number, ticketId: number) {
    if (!address) return;
    const key = `${eventId}-${ticketId}`;
    setRefunding(key);
    try {
      await inowo.refundTicket(address, eventId, ticketId, sign);
      setOutcomes((o) => ({ ...o, [key]: { ok: true, message: "Refunded." } }));
      await scan();
    } catch (err) {
      setOutcomes((o) => ({ ...o, [key]: { ok: false, message: friendlyError(err) } }));
    } finally {
      setRefunding(null);
    }
  }

  if (!address) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-slate-400 mb-4">
          Connect a wallet to see the tickets it holds.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return <p className="text-slate-400 text-sm">Scanning events for your tickets…</p>;
  }

  if (scanError) {
    return (
      <div className={panelClass}>
        <p className="text-red-400 text-sm mb-4">{scanError}</p>
        <button onClick={() => void scan()} className={buttonClass}>
          Try again
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="border border-dashed border-white/10 rounded-xl p-12 text-center">
        <p className="text-slate-300 font-medium mb-2">No tickets yet</p>
        <p className="text-slate-500 text-sm">
          Buy a ticket from an{" "}
          <Link href="/events" className="text-violet-400 hover:text-violet-300">
            event page
          </Link>{" "}
          and it&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tickets.map(({ eventId, eventName, eventStatus, ticketId, tierName, ticket }) => {
        const key = `${eventId}-${ticketId}`;
        const outcome = outcomes[key];
        const canRefund = eventStatus === "Cancelled" && !ticket.refunded;

        return (
          <li key={key} className={panelClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/events/${eventId}`}
                  className="font-semibold hover:text-violet-300 transition-colors"
                >
                  {eventName}
                </Link>
                <p className="text-sm text-slate-400 mt-1">
                  {tierName} · Ticket #{ticketId} · {formatUsdc(ticket.pricePaid)}
                </p>
              </div>
              <StatusPill ticket={ticket} eventStatus={eventStatus} />
            </div>

            {canRefund && (
              <button
                onClick={() => claimRefund(eventId, ticketId)}
                disabled={refunding === key}
                className={`${buttonClass} mt-4`}
              >
                {refunding === key ? "Claiming…" : "Claim refund"}
              </button>
            )}

            {outcome && (
              <p className={`text-sm mt-3 ${outcome.ok ? "text-emerald-400" : "text-red-400"}`}>
                {outcome.message}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({ ticket, eventStatus }: { ticket: Ticket; eventStatus: EventStatus }) {
  if (ticket.refunded) return <Pill tone="amber">Refunded</Pill>;
  if (eventStatus === "Cancelled") return <Pill tone="amber">Refund available</Pill>;
  if (ticket.redeemed) return <Pill tone="slate">Checked in</Pill>;
  return <Pill tone="emerald">Valid</Pill>;
}

function Pill({ tone, children }: { tone: "emerald" | "amber" | "slate"; children: React.ReactNode }) {
  const styles = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }[tone];
  return (
    <span className={`shrink-0 text-xs border px-2 py-0.5 rounded-full ${styles}`}>
      {children}
    </span>
  );
}
