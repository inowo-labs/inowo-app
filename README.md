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

```bash
cp .env.example .env.local
```

> `.env.local` is gitignored and should never be committed. `.env.example` is committed and kept up to date so contributors always know what variables are required.

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styles:** Tailwind CSS
- **Contract interaction:** `@stellar/stellar-sdk` (to be integrated)

## Pages

| Route | What it shows |
|---|---|
| `/` | Landing page |
| `/events` | Every event on the contract, open events first, with escrow balance and funding progress |
| `/events/[id]` | Event detail: status, ticket tiers, every sponsorship, every payout with its memo, escrow and released totals |
| `/dashboard` | Organizer dashboard (wallet integration in progress) |

Event pages read live from [inowo-api](https://github.com/inowo-labs/inowo-api) on every request. Run the API locally (or point `NEXT_PUBLIC_API_URL` at a deployed one) to see data.

## Open for contributors

- Connect wallet (Freighter)
- Sponsor flow — fund an event from the event page
- Organizer dashboard — create events, manage tiers, check in tickets
- Attendee flow — buy tickets, claim refunds; ticket wallet with QR for check-in

See the [Issues](https://github.com/inowo-labs/inowo-app/issues) tab for scoped tasks.

## Related repos

- [inowo-Contract](https://github.com/inowo-labs/inowo-Contract) — Soroban smart contract (Rust)
- [inowo-api](https://github.com/inowo-labs/inowo-api) — read API over the contract

## License

[MIT](./LICENSE)
