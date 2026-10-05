import type { Metadata } from "next";
import Link from "next/link";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "Page Not Found | Inowo",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />
      <div className="flex flex-col items-center justify-center px-6 text-center py-32">
        <p className="text-violet-500 font-mono font-bold text-sm mb-4">404</p>
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-slate-400 mb-10 max-w-sm">
          This page doesn&apos;t exist or has moved. Head back to browse events.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="border border-white/20 hover:border-white/40 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
