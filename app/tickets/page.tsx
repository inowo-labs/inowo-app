"use client";

import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Spinner from "../components/Spinner";
import { useWallet } from "../hooks/useWallet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Ticket {
  event_id: number;
  ticket_id: number;
  tier_index: number;
  owner: string;
  redeemed: boolean;
  /** Event name — populated by the API join, optional for resilience. */
  event_name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTierLabel(index: number): string {
  const labels: Record<number, string> = { 0: "General", 1: "VIP" };
  return labels[index] ?? `Tier ${index}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { address, loading: walletLoading } = useWallet();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch once we know the wallet state and an address is present.
    if (walletLoading || !address) return;

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    setFetchLoading(true);
    setError(null);

    fetch(`${apiBase}/api/wallet/${encodeURIComponent(address)}/tickets`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<Ticket[]>;
      })
      .then((data) => setTickets(data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load tickets";
        setError(message);
      })
      .finally(() => setFetchLoading(false));
  }, [address, walletLoading]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">My Tickets</h1>
          <p className="text-slate-400">
            On-chain ticket ownership, verified against the Stellar contract.
          </p>
        </div>

        {/* ── State 1: wallet not connected ──────────────────────────────── */}
        {!walletLoading && !address && (
          <div
            data-testid="state-not-connected"
            className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-10 text-center"
          >
            <p className="text-violet-300 font-medium mb-2">
              Wallet not connected
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Connect your Freighter wallet to see your tickets.
            </p>
            <button
              disabled
              className="bg-violet-600 opacity-50 cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg"
            >
              Connect Wallet (coming soon)
            </button>
            <p className="text-slate-600 text-xs mt-4">
              Wallet integration tracked in{" "}
              <a
                href="https://github.com/NovaFest-Labs/NovaEvents-app/issues/1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:text-violet-400"
              >
                issue #1
              </a>
              .
            </p>
          </div>
        )}

        {/* ── Loading states ─────────────────────────────────────────────── */}
        {(walletLoading || fetchLoading) && (
          <div
            data-testid="state-loading"
            className="flex justify-center py-24"
          >
            <Spinner size="lg" />
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {!fetchLoading && error && (
          <div
            data-testid="state-error"
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center"
          >
            <p className="text-red-400 font-medium mb-1">
              Could not load tickets
            </p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── State 2: connected but no tickets ──────────────────────────── */}
        {!walletLoading &&
          !fetchLoading &&
          !error &&
          address &&
          tickets.length === 0 && (
            <div
              data-testid="state-no-tickets"
              className="text-center py-24"
            >
              <p className="text-slate-500 mb-4">
                No tickets found for this wallet.
              </p>
              <a
                href="/events"
                className="text-violet-500 hover:text-violet-400 text-sm"
              >
                Browse events →
              </a>
            </div>
          )}

        {/* ── State 3: connected with tickets ────────────────────────────── */}
        {!walletLoading &&
          !fetchLoading &&
          !error &&
          address &&
          tickets.length > 0 && (
            <div
              data-testid="state-has-tickets"
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {tickets.map((ticket) => (
                <div
                  key={`${ticket.event_id}-${ticket.ticket_id}`}
                  className="bg-slate-900 border border-white/10 rounded-xl p-6 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-lg leading-tight">
                      {ticket.event_name ?? `Event #${ticket.event_id}`}
                    </h2>
                    <span
                      className={`shrink-0 text-xs border px-2 py-0.5 rounded-full ${
                        ticket.redeemed
                          ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {ticket.redeemed ? "Redeemed" : "Valid"}
                    </span>
                  </div>

                  <div className="text-sm text-slate-400 flex flex-col gap-1">
                    <span>Tier: {formatTierLabel(ticket.tier_index)}</span>
                    <span className="font-mono text-xs text-slate-600 truncate">
                      Ticket #{ticket.ticket_id} · Event #{ticket.event_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
