import type { Metadata } from "next";
import Nav from "../components/Nav";
import MyTickets from "../components/wallet/MyTickets";

export const metadata: Metadata = {
  title: "My Tickets | Inowo",
};

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
        <p className="text-slate-400 mb-8">
          Every ticket the connected wallet holds, across every event.
        </p>

        <MyTickets />
      </div>
    </div>
  );
}
