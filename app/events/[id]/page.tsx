import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import Nav from "../../components/Nav";
import BackButton from "../../components/BackButton";
import StatusBadge from "../../components/StatusBadge";
import AddressLink from "../../components/AddressLink";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatUsdc, percent } from "../../lib/format";
import type { InowoEvent } from "../../lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

const U32_MAX = 0xffff_ffff;

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id <= U32_MAX ? id : null;
}

// Shared by generateMetadata and the page so the event is fetched once per request.
const loadEvent = cache(async (raw: string): Promise<InowoEvent> => {
  const id = parseId(raw);
  if (id === null) notFound();
  try {
    return await api.event(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const event = await loadEvent((await params).id);
  return {
    title: `${event.name} | Inowo`,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: Props) {
  await connection();
  const event = await loadEvent((await params).id);
  const [tiers, sponsorships, payouts, balance] = await Promise.all([
    api.tiers(event.id),
    api.sponsorships(event.id),
    api.payouts(event.id),
    api.balance(event.id),
  ]);

  const sponsored = sponsorships.reduce((sum, s) => sum + BigInt(s.amount), BigInt(0));
  const progress = percent(event.balance, event.funding_goal);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <BackButton label="Back to Events" />

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold">{event.name}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-slate-400 mb-4">
            {event.venue} · {formatDate(event.date_unix)}
          </p>
          <p className="text-slate-300 max-w-3xl leading-relaxed mb-4">
            {event.description}
          </p>
          <p className="text-sm text-slate-500">
            Organized by <AddressLink address={event.organizer} />
          </p>
        </header>

        {event.status === "Cancelled" && (
          <div className="mb-10 bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-sm text-red-200">
            This event was cancelled. Every sponsor and ticket holder can claim
            a full refund from the contract — no funds can be released to
            anyone else.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4">Ticket tiers</h2>
              <div className="space-y-3">
                {tiers.map((tier) => {
                  const soldOut = tier.tickets_sold >= tier.supply_cap;
                  return (
                    <div
                      key={tier.name}
                      className="bg-slate-900 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">{tier.name}</p>
                        <p className="text-sm text-slate-400">
                          {tier.tickets_sold} / {tier.supply_cap} sold
                          {soldOut && " · Sold out"}
                        </p>
                      </div>
                      <p className="font-mono text-violet-300">
                        {formatUsdc(tier.price)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-semibold">Sponsorships</h2>
                <span className="text-sm text-slate-400">
                  {formatUsdc(sponsored)} from {sponsorships.length}{" "}
                  {sponsorships.length === 1 ? "contribution" : "contributions"}
                </span>
              </div>
              {sponsorships.length === 0 ? (
                <p className="text-slate-500 text-sm border border-dashed border-white/10 rounded-xl p-6">
                  No sponsorships yet.
                </p>
              ) : (
                <ul className="bg-slate-900 border border-white/10 rounded-xl divide-y divide-white/10">
                  {sponsorships.map((s, i) => (
                    <li key={i} className="p-4 flex justify-between text-sm">
                      <AddressLink address={s.sponsor} />
                      <span className="font-mono">{formatUsdc(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-semibold">Payouts</h2>
                <span className="text-sm text-slate-400">
                  {formatUsdc(balance.total_released)} released
                </span>
              </div>
              {payouts.length === 0 ? (
                <p className="text-slate-500 text-sm border border-dashed border-white/10 rounded-xl p-6">
                  {event.status === "Cancelled"
                    ? "Cancelled events never release funds."
                    : event.status === "Active"
                      ? "Funds stay in escrow until the event ends. Every payout will appear here with its purpose."
                      : "No funds have been released yet."}
                </p>
              ) : (
                <ul className="bg-slate-900 border border-white/10 rounded-xl divide-y divide-white/10">
                  {payouts.map((p) => (
                    <li key={p.id} className="p-4 text-sm">
                      <div className="flex justify-between gap-4 mb-1">
                        <span className="font-medium">{p.memo}</span>
                        <span className="font-mono shrink-0">
                          {formatUsdc(p.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-500">
                        <span>
                          to <AddressLink address={p.recipient} />
                        </span>
                        <span>{formatDate(p.timestamp)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-1">In escrow</p>
              <p className="text-3xl font-bold mb-4">
                {formatUsdc(balance.balance)}
              </p>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mb-6">
                {progress}% of {formatUsdc(event.funding_goal)} goal
              </p>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Sponsored</dt>
                  <dd className="font-mono">{formatUsdc(sponsored)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Released</dt>
                  <dd className="font-mono">
                    {formatUsdc(balance.total_released)}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All figures are read live from the Inowo contract on Stellar
              testnet. Click any address to verify it on Stellar Expert.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
