# Arcoin — Arc Network DeFi Operating System

> **Send · Stream · Swap** — USDC payments on Arc Testnet (Chain ID: 5042002)

![Phase](https://img.shields.io/badge/Phase-1%2B2%20Complete-brightgreen)
![Chain](https://img.shields.io/badge/Chain-Arc%20Testnet%205042002-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)

---

## What is Arcoin?

Arcoin is a **non-custodial DeFi payment operating system** built natively on the Arc Network:

- **Send** USDC instantly to any wallet or ArcID (`alice.arc`)
- **Stream** USDC over time via Sablier V2 token streaming
- **Swap** tokens via ApexiSwap on Arc Testnet
- **Escrow** funds with on-chain dispute resolution
- **Register** a human-readable ArcID (ENS-style identity)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ARCOIN FRONTEND                       │
│         Next.js 14 · Privy Auth · wagmi · viem          │
│  ConnectScreen → Dashboard → Send/Stream/Swap/Escrow     │
└────────────────────────┬────────────────────────────────┘
                         │ USDC transactions
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  ARC TESTNET (Chain 5042002)              │
│                                                          │
│  ArcoinRegistry   ·   ArcoinPaymentRouter (0.1% fee)     │
│  ArcoinTreasury   ·   ArcoinEscrow (P2P + Arbiter)       │
│  Sablier V2 — LockupLinear · LockupDynamic               │
│                                                          │
│  USDC: 0x3600000000000000000000000000000000000000        │
└─────────────────────────────────────────────────────────┘
```

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
# Fill in NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_WALLETCONNECT_ID
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | ✅ | Privy app ID — dashboard.privy.io |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | ✅ | WalletConnect — cloud.walletconnect.com |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL |
| `NEXT_PUBLIC_APP_ENV` | ✅ | `development` or `production` |
| `ANTHROPIC_API_KEY` | Optional | Claude AI — console.anthropic.com |
| `DEPLOYER_PRIVATE_KEY` | Contracts | Hardhat deployment wallet (testnet only) |

---

## Contract Addresses — Arc Testnet (Chain ID: 5042002)

| Contract | Address |
|---|---|
| USDC | `0x3600000000000000000000000000000000000000` |
| ApexiSwap | `0x437b1aBf6e5a69548849b15EC35f83A73Fa1E28F` |
| ArcoinRegistry | *(run deploy-all.ts → auto-patched)* |
| ArcoinTreasury | *(run deploy-all.ts → auto-patched)* |
| ArcoinPaymentRouter | *(run deploy-all.ts → auto-patched)* |
| ArcoinEscrow | *(Phase 3)* |

**Explorer:** [atlas.blockscout.com](https://atlas.blockscout.com) · **RPC:** `https://rpc.testnet.arc.network`

---

## Deploy Contracts

```bash
# 1. Get testnet USDC: faucet.circle.com → Arc Testnet
# 2. Set DEPLOYER_PRIVATE_KEY in .env
npx hardhat run contracts/scripts/deploy-all.ts --network arc-testnet
npx ts-node contracts/scripts/post-deploy-patch.ts
```

---

## Deploy Frontend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?repository-url=https://github.com/oamohm/ARCOIN-DASH)

1. Click **Deploy with Vercel** above
2. Add env vars: `NEXT_PUBLIC_PRIVY_APP_ID` · `NEXT_PUBLIC_WALLETCONNECT_ID` · `ANTHROPIC_API_KEY`
3. Set `NEXT_PUBLIC_APP_ENV=production`
4. Click **Deploy** — live in ~2 minutes

---

## Project Structure

```
ARCOIN-DASH/
├── contracts/core/          # ArcoinRegistry, Treasury, Router, Escrow
├── contracts/scripts/       # deploy-all, deploy-sablier, post-deploy-patch
├── locales/                 # en.json · hi.json (Hindi i18n)
├── src/
│   ├── app/                 # Next.js 14 App Router
│   ├── components/          # ConnectScreen, Dashboard, Send, Stream, Swap, Escrow
│   ├── hooks/               # useArcBalance, useArcID, useSendPayment, ...
│   └── lib/                 # chains, constants, i18n, compliance, errors
├── hardhat.config.ts
├── next.config.js
├── vercel.json
└── DEPLOY.md
```

---

## Roadmap

| Phase | Status | Features |
|---|---|---|
| Phase 1 | ✅ Complete | Wallet connect, USDC send, Blockscout |
| Phase 2 | ✅ Complete | Sablier streams, ArcID, Escrow, Swap, Hindi i18n |
| Phase 3 | 🔜 Planned | Chainalysis compliance, multisig, mainnet |
| Phase 4 | 🔜 Planned | Mobile app, push notifications |
| Phase 5 | 🔜 Planned | AI Help full integration (Claude) |

---

## Security

- **ReentrancyGuard** + **SafeERC20** on all contracts
- **72h timelock** on treasury distributions
- **48h timelock** on ArcID fee changes
- **OFAC blocklist** in PaymentRouter
- **On-chain arbiter** dispute resolution in Escrow

> ⚠️ Testnet only — never use mainnet keys in `.env.local`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Auth | Privy (email + embedded wallet + WalletConnect) |
| Web3 | wagmi v2, viem v2, @tanstack/react-query |
| Contracts | Solidity 0.8.24, OpenZeppelin, Hardhat |
| Streaming | Sablier V2 (LockupLinear + LockupDynamic) |
| AI | Anthropic Claude (AI Help — Phase 5) |
| Deploy | Vercel (frontend) · Hardhat (contracts) |
| Chain | Arc Testnet — Chain ID 5042002 |

---

## License

MIT — Copyright (c) 2026 Arcoin — see [LICENSE](LICENSE)

---

*Built on [Arc Network](https://arc.network) · Powered by [Sablier V2](https://sablier.com) · Auth by [Privy](https://privy.io)*
