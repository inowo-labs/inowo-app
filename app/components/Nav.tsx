import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Inowo
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/events"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Events
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <a
            href="https://github.com/inowo-labs/inowo-Contract"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View project on GitHub (opens in new tab)"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </nav>
  );
}
