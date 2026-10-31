// Shapes returned by inowo-api. Amounts are strings of USDC stroops
// (1 USDC = 10_000_000) because i128 exceeds JavaScript's safe integer range.

export type EventStatus = "Active" | "Ended" | "Cancelled";

export interface InowoEvent {
  id: number;
  organizer: string;
  name: string;
  description: string;
  venue: string;
  date_unix: number;
  funding_goal: string;
  balance: string;
  status: EventStatus;
}

export interface TicketTier {
  name: string;
  price: string;
  supply_cap: number;
  tickets_sold: number;
}

export interface Sponsorship {
  sponsor: string;
  amount: string;
}

export interface Payout {
  id: number;
  recipient: string;
  amount: string;
  memo: string;
  timestamp: number;
  /** Hex-encoded SHA-256 of a receipt document; null until attach_receipt is called. */
  receipt_hash: string | null;
  /** Where to find the receipt document, e.g. an IPFS CID; null if never set. */
  receipt_uri: string | null;
}

export interface EventBalance {
  event_id: number;
  balance: string;
  funding_goal: string;
  total_released: string;
}
