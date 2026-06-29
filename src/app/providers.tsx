"use client"
/**
 * ARCOIN — providers.tsx
 * Root provider tree — Circle Developer-Controlled Wallets (no Privy / no WalletConnect)
 *
 * Architecture:
 *   • Wallets are created server-side via Circle API (POST /api/wallet/create)
 *   • Frontend reads wallet address + balance from /api/wallet/me
 *   • On-chain reads use viem directly with the public Arc RPC
 *   • Transactions are signed server-side by Circle, frontend only builds the payload
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createPublicClient, http }          from "viem"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { arcTestnet }                        from "@/lib/chains"

// ─────────────────────────────────────────────────────────────────────────────
// Public viem client — read-only, no wallet needed
// ─────────────────────────────────────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain:     arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
})

// ─────────────────────────────────────────────────────────────────────────────
// Circle Wallet Context
// ─────────────────────────────────────────────────────────────────────────────
interface CircleWallet {
  walletId:  string
  address:   string
  state:     string
}

interface CircleWalletCtx {
  wallet:     CircleWallet | null
  loading:    boolean
  error:      string | null
  createWallet: (userId: string) => Promise<void>
  clearWallet:  () => void
}

const CircleWalletContext = createContext<CircleWalletCtx>({
  wallet: null, loading: false, error: null,
  createWallet: async () => {}, clearWallet: () => {},
})

export function useCircleWallet() {
  return useContext(CircleWalletContext)
}

function CircleWalletProvider({ children }: { children: ReactNode }) {
  const [wallet,  setWallet]  = useState<CircleWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Restore wallet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("arcoin_wallet")
    if (stored) {
      try { setWallet(JSON.parse(stored)) } catch {}
    }
  }, [])

  const createWallet = async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/wallet/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? "Wallet creation failed")
      }
      const data: CircleWallet = await res.json()
      setWallet(data)
      localStorage.setItem("arcoin_wallet", JSON.stringify(data))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const clearWallet = () => {
    setWallet(null)
    localStorage.removeItem("arcoin_wallet")
  }

  return (
    <CircleWalletContext.Provider value={{ wallet, loading, error, createWallet, clearWallet }}>
      {children}
    </CircleWalletContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query client
// ─────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  12_000,   // 12s — matches balance refresh interval
      gcTime:     60_000,
      retry:      2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 10_000),
    },
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Root Providers
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
