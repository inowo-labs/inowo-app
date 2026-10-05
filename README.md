# Inowo App

Frontend for Inowo — a transparent event management platform on Stellar.

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

## Open for contributors

- Connect wallet (Freighter)
- Organizer dashboard — create events, manage tiers
- Attendee view — browse events, buy tickets
- Sponsor view — contribute to events, see public sponsorship breakdown
- Ticket wallet — view owned tickets, show QR for check-in

See the [Issues](https://github.com/inowo-labs/inowo-app/issues) tab for scoped tasks.

## Related repos

- [Inowo contract](https://github.com/inowo-labs/inowo-Contract) — Soroban smart contract (Rust)
- [Inowo API](https://github.com/inowo-labs/inowo-api) — off-chain indexing and notifications
