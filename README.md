# Arcoin — Arc Network DeFi Operating System

> **Send · Stream · Swap** — USDC payments on Arc Testnet (Chain ID: 5042002)

![Phase](https://img.shields.io/badge/Phase-1%2B2%20Complete-brightgreen)
![Chain](https://img.shields.io/badge/Chain-Arc%20Testnet%205042002-blue)
![Auth](https://img.shields.io/badge/Auth-Circle%20Wallets-brightblue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)

---

## What is Arcoin?

Arcoin is a **non-custodial DeFi payment operating system** built natively on the Arc Network. It uses **Circle Developer-Controlled Wallets** — no browser extension, no seed phrase, no Privy, no WalletConnect.

- **Send** USDC instantly to any wallet or ArcID (`alice.arc`)
- **Stream** USDC over time via Sablier V2 token streaming
- **Swap** tokens via ApexiSwap on Arc Testnet
- **Escrow** funds with on-chain dispute resolution
- **Register** a human-readable ArcID (ENS-style identity)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCOIN FRONTEND                          │
│          Next.js 14 · React Query · viem (read-only)         │
│  ConnectScreen → Dashboard → Send / Stream / Swap / Escrow   │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api/* routes (server-side)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               NEXT.JS API ROUTES (server)                    │
│  /api/wallet/create  →  POST Circle API (create wallet)      │
│  /api/wallet/me      →  GET  Circle API (balance / address)  │
│  /api/wallet/send    →  POST Circle API (sign + broadcast)   │
└──────────────────────────┬──────────────────────────────────┘
                           │ CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         CIRCLE DEVELOPER-CONTROLLED WALLETS API              │
│              api.circle.com/v1/w3s                           │
│     Wallet creation · Transaction signing · Broadcasting     │
└──────────────────────────┬──────────────────────────────────┘
                           │ signed transactions
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ARC TESTNET (Chain 5042002)                 │
│  ArcoinRegistry · ArcoinTreasury · ArcoinPaymentRouter        │
│  ArcoinEscrow · Sablier V2 LockupLinear + LockupDynamic       │
│  USDC: 0x3600000000000000000000000000000000000000            │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Roles

| Contract | Role |
|---|---|
| `ArcoinRegistry` | ArcID names (`alice.arc`), 1 USDC/year, 48h fee timelock |
| `ArcoinTreasury` | Protocol fees, 72h timelock, 60/25/15% allocation |
| `ArcoinPaymentRouter` | All USDC payments, 0.1% fee, OFAC blocklist |
| `ArcoinEscrow` | P2P escrow, arbiter disputes, auto-refund |
| `Sablier V2` | Token streaming — LockupLinear + LockupDynamic |

---

## Quick Start

```bash
git clone https://github.com/oamohm/ARCOIN-DASH.git
cd ARCOIN-DASH
npm install
cp .env.example .env.local
# Fill in CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET (see DEPLOY.md)
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Only **one API key** is required to run Arcoin:

| Variable | Required | Description |
|---|---|---|
| `CIRCLE_API_KEY` | ✅ | Circle API key — [console.circle.com](https://console.circle.com) |
| `CIRCLE_ENTITY_SECRET` | ✅ | Circle entity secret — [console.circle.com](https://console.circle.com) |
| `CIRCLE_WALLET_SET_ID` | ✅ | Created once via API (see DEPLOY.md Step 3) |
| `CIRCLE_ENV` | ✅ | `sandbox` (testnet) or `production` |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL |
| `ANTHROPIC_API_KEY` | Optional | Claude AI — AI Help feature (Phase 5) |
| `DEPLOYER_PRIVATE_KEY` | Contracts only | Hardhat deployment wallet (testnet only) |

> ⚠️ Circle keys are **server-side only** — never use `NEXT_PUBLIC_` prefix. They are never sent to the browser.

---

## Contract Addresses — Arc Testnet (Chain ID: 5042002)

| Contract | Address |
|---|---|
| USDC | `0x3600000000000000000000000000000000000000` |
| ApexiSwap Router | `0x437b1aBf6e5a69548849b15EC35f83A73Fa1E28F` |
| CCTP TokenMessengerV2 | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| ArcoinRegistry | *(deploy → auto-patched by post-deploy-patch.ts)* |
| ArcoinTreasury | *(deploy → auto-patched by post-deploy-patch.ts)* |
| ArcoinPaymentRouter | *(deploy → auto-patched by post-deploy-patch.ts)* |

**Explorer:** [atlas.blockscout.com](https://atlas.blockscout.com)  
**Faucet:** [faucet.circle.com](https://faucet.circle.com)  
**RPC:** `https://rpc.testnet.arc.network`

---

## Deploy Contracts

```bash
# Get testnet USDC first: faucet.circle.com → Arc Testnet
npx hardhat run contracts/scripts/deploy-all.ts --network arc-testnet
npx ts-node contracts/scripts/post-deploy-patch.ts
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https://github.com/oamohm/ARCOIN-DASH)

Add these env vars in Vercel Dashboard:

| Key | Value |
|---|---|
| `CIRCLE_API_KEY` | Your Circle production API key |
| `CIRCLE_ENTITY_SECRET` | Your Circle entity secret |
| `CIRCLE_WALLET_SET_ID` | Your wallet set ID |
| `CIRCLE_ENV` | `production` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

See [DEPLOY.md](DEPLOY.md) for the complete step-by-step guide.

---

## How Circle Wallets Work

```
User enters email / ID
        ↓
POST /api/wallet/create  { userId: "user@email.com" }
        ↓
Circle API creates wallet server-side (no seed phrase shown to user)
        ↓
Wallet address returned → stored in React state + localStorage
        ↓
User sends USDC → POST /api/wallet/send { to, amount }
        ↓
Circle signs transaction with entity secret → broadcasts to Arc Testnet
        ↓
Tx hash returned → Blockscout link shown to user
```

---

## Project Structure

```
ARCOIN-DASH/
├── contracts/core/          # ArcoinRegistry, Treasury, Router, Escrow
├── contracts/scripts/       # deploy-all, deploy-sablier, post-deploy-patch
├── locales/                 # en.json · hi.json (Hindi i18n)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── wallet/create/   # POST — Circle wallet creation
│   │   │   ├── wallet/me/       # GET  — wallet address + balance
│   │   │   ├── wallet/send/     # POST — USDC transfer via Circle
│   │   │   └── ai-help/         # POST — Claude AI assistant
│   │   └── ...
│   ├── components/          # ConnectScreen, Dashboard, Send, Stream, Swap, Escrow
│   ├── hooks/               # useArcBalance, useArcID, useSendPayment, ...
│   └── lib/                 # chains, constants (CIRCLE config), i18n, errors
├── hardhat.config.ts
├── next.config.js
├── vercel.json
└── DEPLOY.md
```

---

## Roadmap

| Phase | Status | Features |
|---|---|---|
| Phase 1 | ✅ Complete | Wallet, USDC send, Blockscout, Circle auth |
| Phase 2 | ✅ Complete | Sablier streams, ArcID, Escrow, Swap, Hindi i18n |
| Phase 3 | 🔜 Planned | Chainalysis compliance, multisig ownership, mainnet |
| Phase 4 | 🔜 Planned | Mobile app, push notifications |
| Phase 5 | 🔜 Planned | AI Help full integration (Claude) |

---

## Security

- Circle keys (`CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`) are **server-side only** — never in the browser
- **ReentrancyGuard** + **SafeERC20** on all contracts
- **72h timelock** on treasury distributions
- **48h timelock** on ArcID fee changes
- **OFAC blocklist** in PaymentRouter
- `.env.local` is gitignored — never committed

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Auth / Wallets | Circle Developer-Controlled Wallets |
| On-chain reads | viem v2, @tanstack/react-query |
| Contracts | Solidity 0.8.24, OpenZeppelin, Hardhat |
| Streaming | Sablier V2 (LockupLinear + LockupDynamic) |
| AI | Anthropic Claude (AI Help — Phase 5) |
| Deploy | Vercel (frontend) · Hardhat (contracts) |
| Chain | Arc Testnet — Chain ID 5042002 |

---

## License

MIT — Copyright (c) 2026 Arcoin — see [LICENSE](LICENSE)

---

*Built on [Arc Network](https://arc.network) · Powered by [Circle](https://circle.com) · Streaming by [Sablier V2](https://sablier.com)*
