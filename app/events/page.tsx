import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Nav from "../components/Nav";
import EventCard from "../components/EventCard";
import { api } from "../lib/api";
import type { InowoEvent } from "../lib/types";

export const metadata: Metadata = {
  title: "Events | Inowo",
};

const STATUS_ORDER = { Active: 0, Ended: 1, Cancelled: 2 } as const;

// Open events first, then soonest date first.
function byRelevance(a: InowoEvent, b: InowoEvent) {
  return (
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.date_unix - b.date_unix
  );
}

export default async function EventsPage() {
  await connection();
  const events = (await api.events()).sort(byRelevance);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">Events</h1>
            <p className="text-slate-400">
              Every sponsorship, ticket sale, payout, and refund below is
              settled on Stellar testnet and publicly verifiable.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-12 text-center">
            <p className="text-slate-300 font-medium mb-2">No events yet</p>
            <p className="text-slate-500 text-sm">
              Events created on the contract will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
