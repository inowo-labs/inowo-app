import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate, formatUsdc, percent } from "../lib/format";
import type { InowoEvent } from "../lib/types";

export default function EventCard({ event }: { event: InowoEvent }) {
  const progress = percent(event.balance, event.funding_goal);

  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <div className="bg-slate-900 border border-white/10 hover:border-violet-500/40 rounded-xl p-6 transition-colors h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-tight">{event.name}</h3>
          <StatusBadge status={event.status} />
        </div>

        <div className="text-sm text-slate-400 flex flex-col gap-1">
          <span>{event.venue}</span>
          <span>{formatDate(event.date_unix)}</span>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{formatUsdc(event.balance)} in escrow</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Goal: {formatUsdc(event.funding_goal)}
          </p>
        </div>
      </div>
    </Link>
  );
}
