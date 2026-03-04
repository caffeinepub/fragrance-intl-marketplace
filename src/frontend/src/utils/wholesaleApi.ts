/**
 * Wholesale API stubs — all functions gracefully fall back when the
 * backend functions don't exist yet. Backend implementation coming in a
 * future session.
 */

import type { WholesaleAccount, WholesaleTier } from "../types/wholesale";

const STORAGE_KEY = "wholesale_accounts";
const TIERS_KEY = "wholesale_tiers";

// ── Local storage helpers ─────────────────────────────────────────────────────

function getStoredAccounts(): WholesaleAccount[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredAccounts(accounts: WholesaleAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

function getTiersKey(storeId: string, productId: string): string {
  return `${TIERS_KEY}_${storeId}_${productId}`;
}

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerWholesaleAccount(
  principal: string,
  companyName: string,
  taxId?: string,
  businessDescription?: string,
): Promise<WholesaleAccount> {
  // In production, this would call: await actor.registerWholesaleAccount(companyName, taxId)
  // For now, we store locally with pending status
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.principal === principal);
  if (existing) return existing;

  const newAccount: WholesaleAccount = {
    id: `wholesale-${Date.now()}`,
    principal,
    companyName,
    taxId,
    businessDescription,
    status: "pending",
    createdAt: BigInt(Date.now()),
  };
  accounts.push(newAccount);
  setStoredAccounts(accounts);
  return newAccount;
}

export async function getMyWholesaleAccount(
  principal: string,
): Promise<WholesaleAccount | null> {
  try {
    const accounts = getStoredAccounts();
    return accounts.find((a) => a.principal === principal) ?? null;
  } catch {
    return null;
  }
}

export async function getAllWholesaleAccounts(): Promise<WholesaleAccount[]> {
  try {
    // In production: await actor.getAllWholesaleAccounts()
    return getStoredAccounts();
  } catch {
    return [];
  }
}

export async function approveWholesaleAccount(id: string): Promise<void> {
  try {
    // In production: await actor.approveWholesaleAccount(principal)
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      accounts[idx].status = "approved";
      accounts[idx].approvedAt = BigInt(Date.now());
      setStoredAccounts(accounts);
    }
  } catch {
    // graceful fallback
  }
}

export async function rejectWholesaleAccount(id: string): Promise<void> {
  try {
    // In production: await actor.rejectWholesaleAccount(principal)
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      accounts[idx].status = "rejected";
      setStoredAccounts(accounts);
    }
  } catch {
    // graceful fallback
  }
}

// ── Tiers ─────────────────────────────────────────────────────────────────────

export async function getWholesaleTiers(
  storeId: string,
  productId: string,
): Promise<WholesaleTier[]> {
  try {
    // In production: await actor.getWholesaleTiers(storeId, productId)
    const stored = localStorage.getItem(getTiersKey(storeId, productId));
    if (!stored) return [];
    const raw = JSON.parse(stored) as Array<{
      minQuantity: string;
      pricePerUnit: string;
      label?: string;
    }>;
    return raw.map((t) => ({
      minQuantity: BigInt(t.minQuantity),
      pricePerUnit: BigInt(t.pricePerUnit),
      label: t.label,
    }));
  } catch {
    return [];
  }
}

export async function setWholesaleTiers(
  storeId: string,
  productId: string,
  tiers: WholesaleTier[],
): Promise<void> {
  try {
    // In production: await actor.setWholesaleTiers(storeId, productId, tiers)
    const serializable = tiers.map((t) => ({
      minQuantity: t.minQuantity.toString(),
      pricePerUnit: t.pricePerUnit.toString(),
      label: t.label,
    }));
    localStorage.setItem(
      getTiersKey(storeId, productId),
      JSON.stringify(serializable),
    );
  } catch {
    // graceful fallback
  }
}
