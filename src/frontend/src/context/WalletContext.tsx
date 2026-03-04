import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from "../utils/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  txType: "deposit" | "withdrawal" | "purchase" | "payout";
  amount: number;
  currency: string;
  description: string;
  timestamp: number;
  referenceId?: string;
}

export interface WalletState {
  balance: number; // in USD cents
  currency: string;
  transactions: WalletTransaction[];
}

export interface WalletContextValue {
  balance: number;
  currency: string;
  currencySymbol: string;
  supportedCurrencies: string[];
  transactions: WalletTransaction[];
  topUp: (amount: number, currency: string) => void;
  debit: (amount: number, description: string, referenceId?: string) => boolean;
  setCurrency: (currency: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Re-export for convenience — all symbols come from the shared utility
export { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES };

function getStorageKey(principal: string | null): string {
  return `fragrance_wallet_${principal ?? "guest"}`;
}

function loadWallet(principal: string | null): WalletState {
  try {
    const raw = localStorage.getItem(getStorageKey(principal));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WalletState>;
      return {
        balance: parsed.balance ?? 0,
        currency: parsed.currency ?? "USD",
        transactions: parsed.transactions ?? [],
      };
    }
  } catch {
    // ignore
  }
  return { balance: 0, currency: "USD", transactions: [] };
}

function saveWallet(principal: string | null, state: WalletState): void {
  try {
    localStorage.setItem(getStorageKey(principal), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? null;

  const [walletState, setWalletState] = useState<WalletState>(() =>
    loadWallet(principal),
  );

  // Reload when principal changes (login/logout)
  useEffect(() => {
    setWalletState(loadWallet(principal));
  }, [principal]);

  // Persist on every change
  useEffect(() => {
    saveWallet(principal, walletState);
  }, [principal, walletState]);

  const currencySymbol =
    CURRENCY_SYMBOLS[walletState.currency] ?? walletState.currency;

  const topUp = useCallback((amount: number, currency: string) => {
    setWalletState((prev) => {
      const tx: WalletTransaction = {
        id: generateTxId(),
        txType: "deposit",
        amount,
        currency,
        description: `Top-up via ${currency}`,
        timestamp: Date.now(),
      };
      return {
        ...prev,
        balance: prev.balance + amount,
        transactions: [tx, ...prev.transactions],
      };
    });
  }, []);

  const debit = useCallback(
    (amount: number, description: string, referenceId?: string): boolean => {
      let success = false;
      setWalletState((prev) => {
        if (prev.balance < amount) return prev;
        const tx: WalletTransaction = {
          id: generateTxId(),
          txType: "purchase",
          amount,
          currency: prev.currency,
          description,
          timestamp: Date.now(),
          referenceId,
        };
        success = true;
        return {
          ...prev,
          balance: prev.balance - amount,
          transactions: [tx, ...prev.transactions],
        };
      });
      return success;
    },
    [],
  );

  const setCurrency = useCallback((currency: string) => {
    setWalletState((prev) => ({ ...prev, currency }));
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      balance: walletState.balance,
      currency: walletState.currency,
      currencySymbol,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      transactions: walletState.transactions,
      topUp,
      debit,
      setCurrency,
    }),
    [walletState, currencySymbol, topUp, debit, setCurrency],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
}
