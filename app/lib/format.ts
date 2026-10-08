const STROOPS_PER_USDC = 10_000_000;

export function formatUsdc(stroops: string | bigint): string {
  const usdc = Number(BigInt(stroops)) / STROOPS_PER_USDC;
  return `${usdc.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const EXPLORER = "https://stellar.expert/explorer/testnet";

export function accountUrl(address: string): string {
  return `${EXPLORER}/account/${address}`;
}

/** Percentage of `part` over `whole`, clamped to 0–100. */
export function percent(part: string | bigint, whole: string | bigint): number {
  const w = BigInt(whole);
  if (w <= BigInt(0)) return 0;
  const p = Number((BigInt(part) * BigInt(100)) / w);
  return Math.max(0, Math.min(100, p));
}
