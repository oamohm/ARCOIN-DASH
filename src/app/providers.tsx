"use client"
/**
 * ARCOIN — providers.tsx
 * Root provider tree.
 *
 * Auth: Circle Programmable Wallets — User-Controlled
 *   • KIT_KEY   → NEXT_PUBLIC_CIRCLE_APP_ID   (W3S SDK app init)
 *   • CLIENT_KEY → NEXT_PUBLIC_CIRCLE_CLIENT_KEY (browser SDK)
 *   • API_KEY   → CIRCLE_API_KEY              (server-side API routes only)
 *
 * Flow:
 *   1. User enters email → POST /api/wallet/create-user
 *   2. Server creates Circle user + wallet, returns userToken + challengeId
 *   3. Client uses W3S SDK to complete PIN challenge in iframe
 *   4. Wallet address stored in state + localStorage
 *   5. Sends: POST /api/wallet/send → server initiates transfer challenge
 *   6. Client completes challenge via SDK → transaction broadcast
 */

import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createPublicClient, http }          from "viem"
import { arcTestnet }                        from "@/lib/chains"

// ─────────────────────────────────────────────────────────────────────────────
// Public viem client — on-chain reads (balance, events) — no wallet needed
// ─────────────────────────────────────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain:     arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
})

// ─────────────────────────────────────────────────────────────────────────────
// Circle W3S SDK — lazy-loaded (browser only, not SSR)
// Uses NEXT_PUBLIC_CIRCLE_APP_ID (your KIT_KEY)
// ─────────────────────────────────────────────────────────────────────────────
let _sdk: unknown = null

async function getCircleSDK() {
  if (_sdk) return _sdk as { execute: (challengeId: string) => Promise<void> }
  const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk")
  const sdk = new W3SSdk({
    appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID! },
  })
  _sdk = sdk
  return sdk
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CircleWallet {
  walletId: string
  address:  string
  state:    string
  userId:   string
}

interface CircleWalletCtx {
  wallet:        CircleWallet | null
  loading:       boolean
  error:         string | null
  /** Step 1 — create user + wallet, triggers PIN challenge */
  connectWallet: (email: string) => Promise<void>
  /** Clear wallet (logout) */
  disconnect:    () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const CircleCtx = createContext<CircleWalletCtx>({
  wallet: null, loading: false, error: null,
  connectWallet: async () => {}, disconnect: () => {},
})

export function useCircleWallet() {
  return useContext(CircleCtx)
}

function CircleWalletProvider({ children }: { children: ReactNode }) {
  const [wallet,  setWallet]  = useState<CircleWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Restore wallet from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcoin_wallet")
      if (stored) setWallet(JSON.parse(stored))
    } catch {}
  }, [])

  const connectWallet = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Server creates Circle user + wallet, returns PIN challenge
      const res = await fetch("/api/wallet/create-user", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? "Wallet setup failed")
      }
      const { userToken, encryptionKey, challengeId, walletId, address, userId }
        = await res.json()

      // 2. Client SDK completes PIN challenge (Circle iframe handles PIN UI)
      const sdk = await getCircleSDK()
      sdk.setAuthentication({ userToken, encryptionKey })
      await new Promise<void>((resolve, reject) => {
        sdk.execute(challengeId, (err: Error | null) => {
          if (err) reject(err)
          else resolve()
        })
      })

      // 3. Store wallet
      const w: CircleWallet = { walletId, address, state: "LIVE", userId }
      setWallet(w)
      localStorage.setItem("arcoin_wallet", JSON.stringify(w))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setWallet(null)
    localStorage.removeItem("arcoin_wallet")
  }, [])

  return (
    <CircleCtx.Provider value={{ wallet, loading, error, connectWallet, disconnect }}>
      {children}
    </CircleCtx.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query
// ─────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  12_000,
      gcTime:     60_000,
      retry:      2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 10_000),
    },
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CircleWalletProvider>
        {children}
      </CircleWalletProvider>
    </QueryClientProvider>
  )
}
