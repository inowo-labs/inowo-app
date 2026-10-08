import type {
  EventBalance,
  InowoEvent,
  Payout,
  Sponsorship,
  TicketTier,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  // Contract state changes with every transaction, so never serve it from cache.
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  events: () => get<InowoEvent[]>("/api/events"),
  event: (id: number) => get<InowoEvent>(`/api/events/${id}`),
  tiers: (id: number) => get<TicketTier[]>(`/api/events/${id}/tiers`),
  sponsorships: (id: number) => get<Sponsorship[]>(`/api/events/${id}/sponsorships`),
  payouts: (id: number) => get<Payout[]>(`/api/events/${id}/payouts`),
  balance: (id: number) => get<EventBalance>(`/api/events/${id}/balance`),
};
