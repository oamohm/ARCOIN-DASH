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

Arcoin is a **non-custodial DeFi payment operating system** built natively on the Arc Network. It uses **Circle Programmable Wallets (User-Controlled)** — no browser extension, no seed phrase, no Privy, no WalletConnect.

- **Send** USDC instantly to any wallet or ArcID (`alice.arc`)
- **Stream** USDC over time via Sablier V2 token streaming
- **Swap** tokens via ApexiSwap on Arc Testnet
- **Escrow** funds with on-chain dispute resolution
- **Register** a human-readable ArcID (ENS-style identity)

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     ARCOIN FRONTEND                            │
│      Next.js 14 · React Query · viem (read-only) · W3S SDK    │
│  ConnectScreen → PIN Setup → Dashboard → Send/Stream/Swap      │
└───────────────────────────┬───────────────────────────────────┘
    NEXT_PUBLIC_CIRCLE_APP_ID │ (KIT_KEY) — W3S SDK challenge UI
                              ▼
┌───────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (server-side)                  │
│  /api/wallet/create-user  → Circle API (create user + wallet)  │
│  /api/wallet/me           → Circle API (balance + address)     │
│  /api/wallet/send         → Circle API (initiate tx challenge) │
└───────────────────────────┬───────────────────────────────────┘
           CIRCLE_API_KEY   │ (TEST_API_KEY) — server only
                            ▼
┌───────────────────────────────────────────────────────────────┐
│         CIRCLE PROGRAMMABLE WALLETS API                        │
│             api.circle.com/v1/w3s                             │
│   User-Controlled — user signs with their own PIN             │
└───────────────────────────┬───────────────────────────────────┘
                            │ signed transactions
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                  ARC TESTNET (Chain 5042002)                   │
│  ArcoinRegistry · ArcoinTreasury · ArcoinPaymentRouter         │
│  ArcoinEscrow · Sablier V2 LockupLinear + LockupDynamic        │
│  USDC: 0x3600000000000000000000000000000000000000             │
└───────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
git clone https://github.com/oamohm/ARCOIN-DASH.git
cd ARCOIN-DASH
npm install
npm install @circle-fin/w3s-pw-web-sdk
cp .env.example .env.local
# Fill in your 3 Circle keys (see below)
npm run dev
# → http://localhost:3000
```

---

## Your Circle Keys — Where They Go

| Your Key | .env.local Variable | Used In |
|---|---|---|
| `TEST_API_KEY` | `CIRCLE_API_KEY` | Server-side API routes only |
| `KIT_KEY` | `NEXT_PUBLIC_CIRCLE_APP_ID` | Browser — W3S SDK |
| `TEST_CLIENT_KEY` | `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` | Browser — SDK client auth |

```env
# .env.local
CIRCLE_API_KEY=cb4a00f7...            ← TEST_API_KEY
NEXT_PUBLIC_CIRCLE_APP_ID=3593b7d80...  ← KIT_KEY
NEXT_PUBLIC_CIRCLE_CLIENT_KEY=659ef78f... ← TEST_CLIENT_KEY
CIRCLE_ENV=sandbox
```

> ⚠️ `CIRCLE_API_KEY` is **server-side only** — never add `NEXT_PUBLIC_` prefix.  
> `NEXT_PUBLIC_CIRCLE_APP_ID` and `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` are public keys by design.

---

## Environment Variables — Complete Reference

| Variable | Required | Description |
|---|---|---|
| `CIRCLE_API_KEY` | ✅ | TEST_API_KEY — server-side Circle API auth |
| `NEXT_PUBLIC_CIRCLE_APP_ID` | ✅ | KIT_KEY — Circle W3S browser SDK app init |
| `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` | ✅ | TEST_CLIENT_KEY — browser SDK client auth |
| `CIRCLE_ENV` | ✅ | `sandbox` (testnet) or `production` |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL |
| `ANTHROPIC_API_KEY` | Optional | Claude AI — AI Help feature (Phase 5) |
| `DEPLOYER_PRIVATE_KEY` | Contracts only | Hardhat deployment wallet |

---

## Contract Addresses — Arc Testnet (Chain ID: 5042002)

| Contract | Address |
|---|---|
| USDC | `0x3600000000000000000000000000000000000000` |
| ApexiSwap Router | `0x437b1aBf6e5a69548849b15EC35f83A73Fa1E28F` |
| CCTP TokenMessengerV2 | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| ArcoinRegistry | *(run deploy-all.ts → auto-patched)* |
| ArcoinTreasury | *(run deploy-all.ts → auto-patched)* |
| ArcoinPaymentRouter | *(run deploy-all.ts → auto-patched)* |

**Explorer:** [atlas.blockscout.com](https://atlas.blockscout.com) · **Faucet:** [faucet.circle.com](https://faucet.circle.com)

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https://github.com/oamohm/ARCOIN-DASH)

Add these 4 env vars in Vercel Dashboard:

```
CIRCLE_API_KEY                 → TEST_API_KEY value
NEXT_PUBLIC_CIRCLE_APP_ID      → KIT_KEY value
NEXT_PUBLIC_CIRCLE_CLIENT_KEY  → TEST_CLIENT_KEY value
CIRCLE_ENV                     → sandbox or production
```

See [DEPLOY.md](DEPLOY.md) for full step-by-step guide.

---

## Roadmap

| Phase | Status | Features |
|---|---|---|
| Phase 1 | ✅ Complete | Wallet, USDC send, Blockscout, Circle auth |
| Phase 2 | ✅ Complete | Sablier streams, ArcID, Escrow, Swap, Hindi i18n |
| Phase 3 | 🔜 Planned | Chainalysis compliance, multisig, mainnet |
| Phase 4 | 🔜 Planned | Mobile app |
| Phase 5 | 🔜 Planned | AI Help — Claude full integration |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Auth / Wallets | Circle Programmable Wallets (User-Controlled) |
| On-chain reads | viem v2, @tanstack/react-query |
| Contracts | Solidity 0.8.24, OpenZeppelin, Hardhat |
| Streaming | Sablier V2 (LockupLinear + LockupDynamic) |
| AI | Anthropic Claude (Phase 5) |
| Deploy | Vercel (frontend) · Hardhat (contracts) |
| Chain | Arc Testnet — Chain ID 5042002 |

---

## License

MIT — Copyright (c) 2026 Arcoin — see [LICENSE](LICENSE)

---

*Built on [Arc Network](https://arc.network) · Powered by [Circle](https://circle.com) · Streaming by [Sablier V2](https://sablier.com)*
