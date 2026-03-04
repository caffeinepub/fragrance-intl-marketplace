// ─── Shipping Utility (UPS India Simulation) ────────────────────────────────
// All data is simulated locally in localStorage.
// Designed to be easily wired to real UPS India backend API later.

export type ShippingRate = {
  serviceCode: string;
  serviceName: string;
  estimatedDays: number;
  /** Price in paise (₹) — 1 INR = 100 paise */
  priceInCents: number;
};

export type ShipmentStatus =
  | "created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export type TrackingEvent = {
  timestamp: Date;
  location: string;
  description: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: Date | null;
  createdAt: Date;
  events: TrackingEvent[];
};

// ── Serialised form (stored in localStorage) ──────────────────────────────────

type SerializedShipment = Omit<
  Shipment,
  "estimatedDelivery" | "createdAt" | "events"
> & {
  estimatedDelivery: string | null;
  createdAt: string;
  events: { timestamp: string; location: string; description: string }[];
};

function deserialize(raw: SerializedShipment): Shipment {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    estimatedDelivery: raw.estimatedDelivery
      ? new Date(raw.estimatedDelivery)
      : null,
    events: raw.events.map((e) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
  };
}

const STORAGE_KEY = "fragrance_shipments";

function loadAll(): SerializedShipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SerializedShipment[]) : [];
  } catch {
    return [];
  }
}

function saveAll(shipments: SerializedShipment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
}

// ── Rate calculation (simulated UPS India tiers) ───────────────────────────────

/**
 * Simulates UPS India rate API. Returns 3 service tiers.
 * When wiring to real backend, replace with: actor.getShippingRates(origin, dest, weight)
 */
export function getShippingRates(
  _originPin: string,
  _destPin: string,
  weightGrams: number,
): ShippingRate[] {
  // Weight-based price multiplier
  const weightMultiplier =
    weightGrams > 5000 ? 1.5 : weightGrams > 2000 ? 1.2 : 1.0;

  return [
    {
      serviceCode: "STD",
      serviceName: "UPS Standard",
      estimatedDays: 5,
      priceInCents: Math.round(15000 * weightMultiplier),
    },
    {
      serviceCode: "EXP",
      serviceName: "UPS Express",
      estimatedDays: 2,
      priceInCents: Math.round(35000 * weightMultiplier),
    },
    {
      serviceCode: "OVN",
      serviceName: "UPS Overnight",
      estimatedDays: 1,
      priceInCents: Math.round(65000 * weightMultiplier),
    },
  ];
}

/** Format paise as ₹ display string */
export function formatShippingPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

// ── Shipment creation ─────────────────────────────────────────────────────────

function generateTrackingNumber(orderId: string, serviceCode: string): string {
  // Format: UPS-IN-{orderIdShort}-{serviceCode}-{randomHex}
  const short = orderId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `UPS-IN-${short}-${serviceCode}-${rand}`;
}

function generateInitialEvents(
  serviceName: string,
  createdAt: Date,
): TrackingEvent[] {
  return [
    {
      timestamp: createdAt,
      location: "Mumbai Hub, India",
      description: `Shipment created — ${serviceName} service selected`,
    },
  ];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Creates a new shipment record in localStorage.
 * When wiring to real backend: replace with actor.createShipment(orderId, serviceCode)
 */
export function createShipment(
  orderId: string,
  serviceCode: string,
  serviceName: string,
  estimatedDays: number,
): Shipment {
  const existing = loadAll();
  const createdAt = new Date();

  const shipment: Shipment = {
    id: `ship-${Date.now()}`,
    orderId,
    carrier: "UPS India",
    trackingNumber: generateTrackingNumber(orderId, serviceCode),
    status: "created",
    serviceCode,
    serviceName,
    estimatedDelivery: addDays(createdAt, estimatedDays),
    createdAt,
    events: generateInitialEvents(serviceName, createdAt),
  };

  // Serialise for storage
  const serialized: SerializedShipment = {
    ...shipment,
    createdAt: shipment.createdAt.toISOString(),
    estimatedDelivery: shipment.estimatedDelivery?.toISOString() ?? null,
    events: shipment.events.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })),
  };

  saveAll([...existing, serialized]);
  return shipment;
}

// ── Shipment retrieval ────────────────────────────────────────────────────────

/** Get shipment by orderId */
export function getShipmentByOrderId(orderId: string): Shipment | null {
  const all = loadAll();
  const found = all.find((s) => s.orderId === orderId);
  return found ? deserialize(found) : null;
}

/** Get shipment by tracking number */
export function getShipment(trackingNumber: string): Shipment | null {
  const all = loadAll();
  const found = all.find((s) => s.trackingNumber === trackingNumber);
  return found ? deserialize(found) : null;
}

/** Get all shipments */
export function getAllShipments(): Shipment[] {
  return loadAll().map(deserialize);
}

// ── Tracking event simulation ──────────────────────────────────────────────────

const TRANSIT_EVENTS: { location: string; description: string }[] = [
  {
    location: "Mumbai Hub, India",
    description: "Package picked up from vendor warehouse",
  },
  {
    location: "Delhi Sorting Facility, India",
    description: "Arrived at sorting facility",
  },
  {
    location: "Delhi Sorting Facility, India",
    description: "Departed sorting facility",
  },
  {
    location: "Local Delivery Centre",
    description: "Out for delivery",
  },
  {
    location: "Destination",
    description: "Delivered — signature obtained",
  },
];

/**
 * Returns simulated tracking events for a tracking number.
 * When wiring to real backend: replace with actor.getTrackingEvents(trackingNumber)
 */
export function getTrackingEvents(trackingNumber: string): TrackingEvent[] {
  const shipment = getShipment(trackingNumber);
  if (!shipment) return [];
  return shipment.events;
}

// ── Status update (for vendor/admin simulation) ───────────────────────────────

/**
 * Advances a shipment to the next simulated status step.
 * When wiring to real backend: replace with actor.updateShipmentStatus(id, status)
 */
export function advanceShipmentStatus(shipmentId: string): Shipment | null {
  const all = loadAll();
  const idx = all.findIndex((s) => s.id === shipmentId);
  if (idx === -1) return null;

  const current = all[idx];
  const statusOrder: ShipmentStatus[] = [
    "created",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const currentIdx = statusOrder.indexOf(current.status as ShipmentStatus);
  const nextStatus =
    statusOrder[Math.min(currentIdx + 1, statusOrder.length - 1)];

  if (nextStatus === current.status) return deserialize(current);

  const now = new Date().toISOString();
  const eventIdx = Math.min(currentIdx + 1, TRANSIT_EVENTS.length - 1);
  const newEvent = {
    timestamp: now,
    location: TRANSIT_EVENTS[eventIdx].location,
    description: TRANSIT_EVENTS[eventIdx].description,
  };

  const updated: SerializedShipment = {
    ...current,
    status: nextStatus,
    events: [...current.events, newEvent],
  };

  all[idx] = updated;
  saveAll(all);
  return deserialize(updated);
}
