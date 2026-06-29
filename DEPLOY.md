# ARCOIN — Deployment Guide

> **Auth:** Circle Programmable Wallets (User-Controlled) — 3 keys required, no Entity Secret.

---

## Your Circle Keys — Where They Go

| Your Key Name | .env.local Variable | Used In |
|---|---|---|
| `TEST_API_KEY` | `CIRCLE_API_KEY` | Server-side API routes only |
| `KIT_KEY` | `NEXT_PUBLIC_CIRCLE_APP_ID` | Browser — W3S SDK app init |
| `TEST_CLIENT_KEY` | `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` | Browser — SDK client auth |

All 3 keys are from: **console.circle.com → Programmable Wallets**

---

## Step 1: Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
# Your TEST_API_KEY:
CIRCLE_API_KEY=cb4a00f7...

# Your KIT_KEY:
NEXT_PUBLIC_CIRCLE_APP_ID=3593b7d80...

# Your TEST_CLIENT_KEY:
NEXT_PUBLIC_CIRCLE_CLIENT_KEY=659ef78f...

# Circle mode (sandbox = testnet, production = mainnet):
CIRCLE_ENV=sandbox

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Optional — AI Help feature:
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Step 2: Install Dependencies

```bash
npm install
# Circle W3S browser SDK:
npm install @circle-fin/w3s-pw-web-sdk
```

---

## Step 3: Run Locally

```bash
npm run dev
# → http://localhost:3000
```

**How wallet connect works:**
1. User opens ConnectScreen → enters email
2. Frontend: `POST /api/wallet/create-user { email }`
3. Server: Circle API creates user + wallet → returns `userToken`, `challengeId`
4. Browser: Circle W3S SDK opens PIN setup iframe
5. User sets 6-digit PIN → wallet activated
6. Wallet address stored in state + localStorage

**How sending works:**
1. User enters amount + recipient on SendScreen
2. Frontend: `POST /api/wallet/send { to, amount, walletId, userToken }`
3. Server: Circle API initiates transfer → returns `challengeId`
4. Browser: SDK prompts PIN → user confirms → Circle broadcasts tx
5. Tx hash returned → Blockscout link shown

---

## Step 4: Get Testnet USDC

1. Go to [faucet.circle.com](https://faucet.circle.com)
2. Select **Arc Testnet**
3. Paste your Circle wallet address
4. Receive 10 USDC

---

## Step 5: Deploy Smart Contracts (optional for testnet)

```bash
# Add to .env.local:
# DEPLOYER_PRIVATE_KEY=0xYourTestnetKey

npx hardhat run contracts/scripts/deploy-all.ts --network arc-testnet
npx ts-node contracts/scripts/post-deploy-patch.ts
```

---

## Step 6: Verify Contracts on Blockscout

```bash
npx hardhat verify --network arc-testnet <REGISTRY_ADDR> \
  "0x3600000000000000000000000000000000000000" "<TREASURY_ADDR>" "<DEPLOYER_ADDR>"

npx hardhat verify --network arc-testnet <ROUTER_ADDR> \
  "0x3600000000000000000000000000000000000000" "<TREASURY_ADDR>" "<DEPLOYER_ADDR>"
```

---

## Step 7: Deploy to Vercel

**Option A — Dashboard:**
1. [vercel.com/new](https://vercel.com/new) → Import `oamohm/ARCOIN-DASH`
2. Add environment variables:

| Key | Value |
|---|---|
| `CIRCLE_API_KEY` | Your TEST_API_KEY value |
| `NEXT_PUBLIC_CIRCLE_APP_ID` | Your KIT_KEY value |
| `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` | Your TEST_CLIENT_KEY value |
| `CIRCLE_ENV` | `sandbox` (testnet) or `production` |
| `NEXT_PUBLIC_APP_URL` | https://arcoin-dash.vercel.app |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `ANTHROPIC_API_KEY` | Optional |

3. Click **Deploy**

**Option B — CLI:**
```bash
npm install -g vercel
vercel --prod
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/wallet/create-user` | POST | Create Circle user + wallet, return PIN challenge |
| `/api/wallet/me` | GET | Get wallet address + USDC balance |
| `/api/wallet/send` | POST | Initiate USDC transfer, return sign challenge |
| `/api/ai-help` | POST | Claude AI assistant (Phase 5) |

---

## Deployment Checklist

```
CIRCLE SETUP
☐ CIRCLE_API_KEY set (TEST_API_KEY value)
☐ NEXT_PUBLIC_CIRCLE_APP_ID set (KIT_KEY value)
☐ NEXT_PUBLIC_CIRCLE_CLIENT_KEY set (TEST_CLIENT_KEY value)
☐ CIRCLE_ENV = sandbox (testnet) or production

LOCAL TEST
☐ npm run dev works
☐ ConnectScreen: email → PIN setup → wallet address shows
☐ USDC balance displays

VERCEL
☐ All 3 Circle keys added in Vercel Dashboard
☐ CIRCLE_ENV = production for mainnet
☐ Deployed + smoke-tested
```

---

## Security Notes

- `CIRCLE_API_KEY` = server-side only. **Never** use `NEXT_PUBLIC_` prefix on it.
- `NEXT_PUBLIC_CIRCLE_APP_ID` and `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` are safe to expose — they are public keys by design (Circle's SDK requires browser access).
- `.env.local` is gitignored — never commit it.
- Use **sandbox** keys for testnet, request **production** keys from Circle for mainnet.
