"use client";

import Nav from "../components/Nav";

export default function EventsError({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />
      <div className="max-w-md mx-auto px-6 py-32 text-center">
        <p className="text-red-400 font-mono font-bold text-sm mb-4">
          Can&apos;t reach the API
        </p>
        <h1 className="text-3xl font-bold mb-4">Event data is unavailable</h1>
        <p className="text-slate-400 mb-8">
          The Inowo API or the Stellar RPC it reads from didn&apos;t respond.
          Your funds are safe on-chain — this only affects the display.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
