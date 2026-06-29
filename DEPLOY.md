# ARCOIN — Deployment Guide

> **Auth:** Circle Developer-Controlled Wallets — only `CIRCLE_API_KEY` required. No Privy. No WalletConnect.

---

## Prerequisites

```bash
node --version   # v18+
npm --version    # v9+
npm install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

---

## Step 1: Get Circle API Key

1. Go to [console.circle.com](https://console.circle.com)
2. Sign up / log in → **Developer** tab → **API Keys**
3. Create a new API key → copy it
4. Under **Entity Secret** → generate and copy your entity secret

---

## Step 2: Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
# Circle API — server-side only (NEVER use NEXT_PUBLIC_ prefix)
CIRCLE_API_KEY=TEST_API_KEY:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CIRCLE_ENTITY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CIRCLE_WALLET_SET_ID=         # filled in Step 3
CIRCLE_ENV=sandbox             # "sandbox" for testnet, "production" for mainnet

# Anthropic — AI Help feature (optional)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Contracts (auto-filled by post-deploy-patch.ts after Step 5)
DEPLOYER_PRIVATE_KEY=0xabc123...
TREASURY_MULTISIG=0xYourAddress
DEV_FUND=0xYourAddress
LIQUIDITY_RESERVE=0xYourAddress
COMMUNITY_MULTISIG=0xYourAddress
```

---

## Step 3: Create Circle Wallet Set (one-time setup)

```bash
node -e "
const key = process.env.CIRCLE_API_KEY;
fetch('https://api.circle.com/v1/w3s/walletSets', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Arcoin Users' })
})
.then(r => r.json())
.then(d => console.log('WALLET SET ID:', d.data?.walletSet?.id))
"
```

Copy the Wallet Set ID → paste into `.env.local` as `CIRCLE_WALLET_SET_ID`.

---

## Step 4: Get Testnet USDC (for contract deployment gas)

1. Go to [faucet.circle.com](https://faucet.circle.com)
2. Select **Arc Testnet**
3. Paste your deployer wallet address
4. Receive 10 USDC

---

## Step 5: Deploy Smart Contracts

```bash
# Deploy all 4 contracts in one command
npx hardhat run contracts/scripts/deploy-all.ts --network arc-testnet

# Auto-patch deployed addresses into constants.ts
npx ts-node contracts/scripts/post-deploy-patch.ts
```

**Expected output:**
```
✓ ArcoinRegistry     deployed → 0xABCD...
✓ ArcoinTreasury     deployed → 0x1234...
✓ ArcoinPaymentRouter deployed → 0x5678...
✓ constants.ts patched with deployed addresses
```

---

## Step 6: Run Locally

```bash
npm run dev
# → http://localhost:3000
```

How it works:
- User enters email / user ID on ConnectScreen
- Frontend calls `POST /api/wallet/create` with `{ userId }`
- Server calls Circle API → creates developer-controlled wallet
- Wallet address returned → stored in localStorage + state
- All USDC transactions are signed by Circle on the server

---

## Step 7: Verify Contracts on Blockscout

```bash
npx hardhat verify --network arc-testnet <REGISTRY_ADDR> \
  "0x3600000000000000000000000000000000000000" "<TREASURY_ADDR>" "<DEPLOYER_ADDR>"

npx hardhat verify --network arc-testnet <TREASURY_ADDR> \
  "0x3600000000000000000000000000000000000000" \
  "<DEPLOYER_ADDR>" "<DEPLOYER_ADDR>" "<DEPLOYER_ADDR>" "<DEPLOYER_ADDR>" "<DEPLOYER_ADDR>"

npx hardhat verify --network arc-testnet <ROUTER_ADDR> \
  "0x3600000000000000000000000000000000000000" "<TREASURY_ADDR>" "<DEPLOYER_ADDR>"
```

---

## Step 8: Deploy to Vercel

**Option A — Dashboard:**
1. [vercel.com/new](https://vercel.com/new) → Import `oamohm/ARCOIN-DASH`
2. Add environment variables:
   ```
   CIRCLE_API_KEY        → from console.circle.com
   CIRCLE_ENTITY_SECRET  → from console.circle.com
   CIRCLE_WALLET_SET_ID  → from Step 3
   CIRCLE_ENV            → production
   ANTHROPIC_API_KEY     → optional
   NEXT_PUBLIC_APP_URL   → https://arcoin-dash.vercel.app
   NEXT_PUBLIC_APP_ENV   → production
   ```
3. Click **Deploy**

**Option B — CLI:**
```bash
npm install -g vercel
vercel --prod
```

---

## Deployment Checklist

```
CIRCLE SETUP
☐ CIRCLE_API_KEY set (sandbox or production)
☐ CIRCLE_ENTITY_SECRET set
☐ CIRCLE_WALLET_SET_ID created and set

CONTRACTS
☐ Deployer wallet has testnet USDC
☐ All 4 contracts deployed (deploy-all.ts)
☐ constants.ts patched (post-deploy-patch.ts)
☐ Contracts verified on Blockscout

FRONTEND
☐ .env.local filled (never committed)
☐ npm run dev works locally
☐ /api/wallet/create returns a wallet address
☐ USDC balance displays correctly

VERCEL
☐ All env vars set in Vercel Dashboard
☐ CIRCLE_API_KEY uses production key for mainnet
☐ Deployed and smoke-tested
```

---

## API Routes (Circle integration)

| Route | Method | Description |
|---|---|---|
| `/api/wallet/create` | POST | Create Circle wallet for a user ID |
| `/api/wallet/me` | GET | Get wallet address + USDC balance |
| `/api/wallet/send` | POST | Send USDC via Circle API |
| `/api/ai-help` | POST | Claude AI assistant (Phase 5) |

All Circle API calls are server-side only. `CIRCLE_API_KEY` is never exposed to the browser.

---

## Security Notes

- `CIRCLE_API_KEY` and `CIRCLE_ENTITY_SECRET` must NEVER have `NEXT_PUBLIC_` prefix
- `.env.local` is gitignored — never commit it
- Use Circle **sandbox** keys for testnet, **production** keys for mainnet
- Rotate entity secret immediately if leaked
