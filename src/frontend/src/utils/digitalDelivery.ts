// Digital Delivery Utility — Phase 5.2
// All storage is localStorage-simulated; no backend endpoints required.

const STORAGE_KEY = "fragrance_digital_entitlements";

export type DigitalEntitlement = {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  storeId: string;
  downloadUrl: string; // simulated path
  downloadToken: string; // random hex
  expiresAt: string; // ISO string (serialised Date)
  downloadCount: number;
  maxDownloads: number; // 5
  purchasedAt: string; // ISO string
  fileSize: string; // e.g. "12.4 MB"
  fileType: string; // e.g. "ZIP", "PDF", "MP3"
};

// ─── File type helpers ────────────────────────────────────────────────────────

const FILE_TYPES = ["ZIP", "PDF", "MP3", "EPUB", "MP4"];
const FILE_SIZES = [
  "4.2 MB",
  "8.7 MB",
  "12.4 MB",
  "23.1 MB",
  "56.8 MB",
  "102.3 MB",
  "3.1 MB",
  "18.9 MB",
];

function deterministicChoice<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return arr[hash % arr.length];
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Core API ─────────────────────────────────────────────────────────────────

function loadAll(): DigitalEntitlement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(items: DigitalEntitlement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Create entitlements for all digital items in an order */
export function createEntitlements(
  orderId: string,
  items: {
    productId: string;
    storeId: string;
    title: string;
    productType: string;
  }[],
): DigitalEntitlement[] {
  const existing = loadAll();
  const existingIds = new Set(
    existing.filter((e) => e.orderId === orderId).map((e) => e.productId),
  );

  const digitalItems = items.filter(
    (i) => i.productType === "digital" && !existingIds.has(i.productId),
  );

  if (digitalItems.length === 0) {
    // Return already-existing entitlements for this order
    return existing.filter((e) => e.orderId === orderId);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  const newEntitlements: DigitalEntitlement[] = digitalItems.map((item) => ({
    id: `ent-${orderId.slice(-6)}-${item.productId.slice(-6)}-${randomHex(4)}`,
    orderId,
    productId: item.productId,
    productTitle: item.title,
    storeId: item.storeId,
    downloadUrl: `/assets/downloads/sample-${item.productId}.zip`,
    downloadToken: randomHex(32),
    expiresAt: expiresAt.toISOString(),
    downloadCount: 0,
    maxDownloads: 5,
    purchasedAt: now.toISOString(),
    fileSize: deterministicChoice(FILE_SIZES, item.productId),
    fileType: deterministicChoice(FILE_TYPES, item.productId),
  }));

  saveAll([...existing, ...newEntitlements]);
  return newEntitlements;
}

/** Fetch entitlements for a specific order */
export function getEntitlements(orderId: string): DigitalEntitlement[] {
  return loadAll().filter((e) => e.orderId === orderId);
}

/** Fetch all entitlements */
export function getAllEntitlements(): DigitalEntitlement[] {
  return loadAll();
}

/** Simulate a download — increments count, returns URL + filename */
export function recordDownload(
  entitlementId: string,
): { url: string; filename: string } | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === entitlementId);
  if (idx < 0) return null;

  const ent = all[idx];
  if (!isEntitlementValid(ent)) return null;

  all[idx] = { ...ent, downloadCount: ent.downloadCount + 1 };
  saveAll(all);

  const filename = `${ent.productTitle.replace(/\s+/g, "-").toLowerCase()}.${ent.fileType.toLowerCase()}`;
  return { url: ent.downloadUrl, filename };
}

/** Returns true if the entitlement is still usable */
export function isEntitlementValid(ent: DigitalEntitlement): boolean {
  const expired = new Date(ent.expiresAt) < new Date();
  const exhausted = ent.downloadCount >= ent.maxDownloads;
  return !expired && !exhausted;
}

/** Days remaining until expiry (negative if expired) */
export function daysUntilExpiry(ent: DigitalEntitlement): number {
  const ms = new Date(ent.expiresAt).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
