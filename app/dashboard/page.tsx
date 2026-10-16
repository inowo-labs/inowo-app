import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import CreateEventForm from "../components/wallet/CreateEventForm";

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

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Create a new event</h2>
          <CreateEventForm />
        </section>

        <p className="text-sm text-slate-500">
          To end or cancel an event, or release escrowed funds to recipients, open it
          from the{" "}
          <Link href="/events" className="text-violet-400 hover:text-violet-300">
            events list
          </Link>{" "}
          with the organizer&apos;s wallet connected.
        </p>
      </div>
    </div>
  );
}
