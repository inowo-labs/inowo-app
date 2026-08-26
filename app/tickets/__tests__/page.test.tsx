/**
 * Tests for the /tickets page.
 *
 * Three UI states under test:
 *   1. Wallet not connected  — shows "Wallet not connected" prompt
 *   2. Connected, no tickets — shows "No tickets found" empty state
 *   3. Connected, has tickets — renders the ticket cards
 *
 * Strategy:
 *   - Mock `../hooks/useWallet` to control wallet state without a browser extension.
 *   - Mock `global.fetch` to control the API response without a running server.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TicketsPage from "../page";

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../hooks/useWallet", () => ({
  useWallet: vi.fn(),
}));

// Next.js Link / navigation stubs
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useWallet } from "../../hooks/useWallet";

const mockUseWallet = useWallet as ReturnType<typeof vi.fn>;

function stubWallet(address: string | null, loading = false) {
  mockUseWallet.mockReturnValue({ address, loading });
}

function stubFetch(tickets: object[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => tickets,
  } as Response);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TicketsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch so tests that don't stub it don't accidentally resolve.
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── State 1: wallet not connected ───────────────────────────────────────────

  it("shows the not-connected prompt when wallet address is null", () => {
    stubWallet(null);

    render(<TicketsPage />);

    expect(screen.getByTestId("state-not-connected")).toBeInTheDocument();
    expect(
      screen.getByText(/wallet not connected/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/connect your freighter wallet/i)
    ).toBeInTheDocument();
    // The other two states must not be visible.
    expect(screen.queryByTestId("state-no-tickets")).not.toBeInTheDocument();
    expect(screen.queryByTestId("state-has-tickets")).not.toBeInTheDocument();
  });

  it("does not call the API when wallet is not connected", () => {
    stubWallet(null);
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    render(<TicketsPage />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ── State 2: connected but no tickets ───────────────────────────────────────

  it("shows empty state when wallet is connected but API returns no tickets", async () => {
    stubWallet("GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK");
    stubFetch([]);

    render(<TicketsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("state-no-tickets")).toBeInTheDocument()
    );
    expect(
      screen.getByText(/no tickets found for this wallet/i)
    ).toBeInTheDocument();
    // The ticket grid and not-connected prompt must not appear.
    expect(screen.queryByTestId("state-not-connected")).not.toBeInTheDocument();
    expect(screen.queryByTestId("state-has-tickets")).not.toBeInTheDocument();
  });

  it("calls the API with the connected wallet address", async () => {
    const address = "GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK";
    stubWallet(address);
    stubFetch([]);

    render(<TicketsPage />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledOnce());
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string
    ];
    expect(url).toContain(encodeURIComponent(address));
    expect(url).toContain("/tickets");
  });

  // ── State 3: connected with tickets ─────────────────────────────────────────

  it("renders ticket cards when the API returns tickets", async () => {
    stubWallet("GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK");
    stubFetch([
      {
        event_id: 0,
        ticket_id: 0,
        tier_index: 0,
        owner: "GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK",
        redeemed: false,
        event_name: "Stellar Summit",
      },
      {
        event_id: 1,
        ticket_id: 2,
        tier_index: 1,
        owner: "GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK",
        redeemed: true,
        event_name: "Soroban Hackathon",
      },
    ]);

    render(<TicketsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("state-has-tickets")).toBeInTheDocument()
    );

    // Both event names must appear
    expect(screen.getByText("Stellar Summit")).toBeInTheDocument();
    expect(screen.getByText("Soroban Hackathon")).toBeInTheDocument();

    // Tier labels
    expect(screen.getAllByText(/general/i)).toHaveLength(1);
    expect(screen.getAllByText(/vip/i)).toHaveLength(1);

    // Redemption statuses
    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Redeemed")).toBeInTheDocument();

    // Other states must not appear
    expect(screen.queryByTestId("state-not-connected")).not.toBeInTheDocument();
    expect(screen.queryByTestId("state-no-tickets")).not.toBeInTheDocument();
  });

  it("shows a fallback event label when event_name is missing", async () => {
    stubWallet("GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK");
    stubFetch([
      {
        event_id: 5,
        ticket_id: 0,
        tier_index: 0,
        owner: "GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK",
        redeemed: false,
        // no event_name
      },
    ]);

    render(<TicketsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("state-has-tickets")).toBeInTheDocument()
    );
    expect(screen.getByText("Event #5")).toBeInTheDocument();
  });

  // ── Error state ─────────────────────────────────────────────────────────────

  it("shows an error message when the API call fails", async () => {
    stubWallet("GBWMCCC3NHSKLAOJDBKKYW7SSH2PFTTNVFKWKH6BDLSZRA4ZBXVQBBK");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<TicketsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("state-error")).toBeInTheDocument()
    );
    expect(screen.getByText(/could not load tickets/i)).toBeInTheDocument();
  });
});
