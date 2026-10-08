import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import ConnectButton from "../components/wallet/ConnectButton";

export const metadata: Metadata = {
  title: "Organizer Dashboard | Inowo",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Organizer Dashboard</h1>
          <p className="text-slate-400">
            Create and manage your events. All actions are signed on-chain
            through your Stellar wallet.
          </p>
        </div>

        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-8 text-center mb-12">
          <p className="text-violet-300 font-medium mb-2">
            Organizer tools are coming next
          </p>
          <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
            You can already connect a Freighter wallet to sponsor events and buy
            tickets from any{" "}
            <Link href="/events" className="text-violet-400 hover:text-violet-300">
              event page
            </Link>
            . Creating events, checking in tickets, and releasing funds from this
            dashboard is the next step.
          </p>
          <ConnectButton />
        </div>

        {/* Preview of the create-event form; not wired to the contract yet */}
        <section className="mb-12 opacity-40 pointer-events-none select-none">
          <h2 className="text-xl font-semibold mb-6">Create New Event</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Event name", type: "text" },
              { label: "Venue", type: "text" },
              { label: "Description", type: "text" },
              { label: "Funding goal (USDC)", type: "number" },
            ].map(({ label, type }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-sm text-slate-400">{label}</label>
                <input
                  disabled
                  type={type}
                  className="bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <button
            disabled
            className="mt-6 bg-violet-600 text-white font-medium px-6 py-3 rounded-lg"
          >
            Create Event
          </button>
        </section>
      </div>
    </div>
  );
}
