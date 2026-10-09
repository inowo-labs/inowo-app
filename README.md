# Inowo App

Web frontend for [Inowo](https://github.com/inowo-labs/inowo-Contract) — sponsorship escrow and accountable event budgets on Stellar.

Organizers create events and manage check-in, sponsors fund events and see every contribution, and attendees buy tickets — all signed with a Stellar wallet and settled in USDC by the contract.

Built with Next.js, TypeScript, and Tailwind CSS.

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Set up environment

```bash
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
```

### Run the dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

### Build for production

```bash
npm run build
```

## Environment variables

The app uses the following environment variables. Copy `.env.example` to `.env.local` and fill in the values before running locally.

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for the Inowo API | `http://localhost:3001` |
| `NEXT_PUBLIC_CONTRACT_ID` | Inowo contract the wallet signs transactions for | `CCWFDV2M…NOPV` (testnet) |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC used to simulate and submit transactions | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Network the wallet must be on | `Test SDF Network ; September 2015` |

```bash
cp .env.example .env.local
```

> `.env.local` is gitignored and should never be committed. `.env.example` is committed and kept up to date so contributors always know what variables are required.

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styles:** Tailwind CSS
- **Contract interaction:** `@stellar/stellar-sdk` (simulate, submit) and `@stellar/freighter-api` (wallet signing)

## Pages

| Route | What it shows |
|---|---|
| `/` | Landing page |
| `/events` | Every event on the contract, open events first, with escrow balance and funding progress |
| `/events/[id]` | Event detail: status, ticket tiers, every sponsorship, every payout with its memo, escrow and released totals. With a connected wallet: **sponsor** or **buy a ticket** (active events), **claim a sponsorship refund** (cancelled events) |
| `/dashboard` | Organizer dashboard — organizer tools (create events, check-in, release funds) are next |

Event pages read live from [inowo-api](https://github.com/inowo-labs/inowo-api) on every request. Run the API locally (or point `NEXT_PUBLIC_API_URL` at a deployed one) to see data.

## Try it on testnet

1. Install the [Freighter](https://www.freighter.app/) browser extension and switch it to **Testnet**.
2. Fund your account with Friendbot (Freighter offers this for new testnet accounts).
3. In Freighter, add the asset **USDC** issued by `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` (Circle testnet USDC).
4. Get testnet USDC from [faucet.circle.com](https://faucet.circle.com) (choose Stellar).
5. Open an active event, click **Connect wallet**, and sponsor or buy a ticket. The page refreshes with your contribution once the transaction confirms.

## Open for contributors

| Feature | Difficulty | Issue |
|---------|------------|-------|
| Create events from the organizer dashboard | Hard | [#29](https://github.com/inowo-labs/inowo-app/issues/29) |
| Organizer controls — end, cancel, and release funds | Medium | [#30](https://github.com/inowo-labs/inowo-app/issues/30) |
| My tickets page with ticket refunds | Medium | [#31](https://github.com/inowo-labs/inowo-app/issues/31) |
| Check-in page for organizers | Medium | [#32](https://github.com/inowo-labs/inowo-app/issues/32) |
| Refund history on cancelled events | Easy | [#33](https://github.com/inowo-labs/inowo-app/issues/33) |
| Unit tests for amount parsing, formatting, and error messages | Easy | [#34](https://github.com/inowo-labs/inowo-app/issues/34) |
| Mobile layout — nav overflows on small screens | Easy | [#35](https://github.com/inowo-labs/inowo-app/issues/35) |
| Shared footer on every page | Easy | [#5](https://github.com/inowo-labs/inowo-app/issues/5) |
| Highlight the active nav link | Easy | [#7](https://github.com/inowo-labs/inowo-app/issues/7) |

See the [Issues](https://github.com/inowo-labs/inowo-app/issues) tab for scoped tasks.

## Related repos

- [inowo-Contract](https://github.com/inowo-labs/inowo-Contract) — Soroban smart contract (Rust)
- [inowo-api](https://github.com/inowo-labs/inowo-api) — read API over the contract

## License

[MIT](./LICENSE)
