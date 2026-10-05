import type { Metadata } from "next";
import Nav from "../components/Nav";

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

        {/* Wallet connect prompt */}
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-8 text-center mb-12">
          <p className="text-violet-300 font-medium mb-2">Wallet not connected</p>
          <p className="text-slate-400 text-sm mb-6">
            Connect your Freighter wallet to create events and manage check-ins.
          </p>
          <button
            disabled
            className="bg-violet-600 opacity-50 cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg"
          >
            Connect Wallet (coming soon)
          </button>
        </div>

        {/* Create event form — disabled until wallet is connected */}
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

        <p className="text-center text-slate-600 text-sm">
          Wallet integration tracked in{" "}
          <a
            href="https://github.com/inowo-labs/inowo-app/issues/1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="app issue #1 on GitHub (opens in new tab)"
            className="text-violet-500 hover:text-violet-400"
          >
            app issue #1
          </a>
          .
        </p>
      </div>
    </div>
  );
}
