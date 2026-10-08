import type { EventStatus } from "../lib/types";

const styles: Record<EventStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Ended: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`shrink-0 text-xs border px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
}
