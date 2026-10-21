"use client";

import { useState } from "react";
import Link from "next/link";
import ConnectButton from "./wallet/ConnectButton";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
];

const GITHUB_HREF = "https://github.com/inowo-labs/inowo-Contract";

function DesktopLinks() {
  return (
    <div className="hidden sm:flex items-center gap-6">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          {l.label}
        </Link>
      ))}
      <a
        href={GITHUB_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View project on GitHub (opens in new tab)"
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        GitHub ↗
      </a>
      <ConnectButton />
    </div>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="border-b border-white/10 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          Inowo
        </Link>
        <DesktopLinks />
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <ConnectButton />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="p-2 -m-1 text-slate-300 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden max-w-6xl mx-auto pt-3 pb-1 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-slate-300 hover:text-white transition-colors py-2"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View project on GitHub (opens in new tab)"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-300 hover:text-white transition-colors py-2"
          >
            GitHub ↗
          </a>
        </div>
      )}
    </nav>
  );
}
