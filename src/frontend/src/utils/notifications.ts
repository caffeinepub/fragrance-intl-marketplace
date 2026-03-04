// ─── Notifications Utility ─────────────────────────────────────────────────
// All data stored in localStorage under `fragrance_notifications`

const STORAGE_KEY = "fragrance_notifications";

export type NotificationType =
  | "order_placed"
  | "order_shipped"
  | "order_delivered"
  | "bid_placed"
  | "bid_outbid"
  | "auction_won"
  | "auction_ended"
  | "trade_offer"
  | "trade_accepted"
  | "trade_rejected"
  | "wholesale_approved"
  | "wholesale_rejected"
  | "review_posted"
  | "stream_started"
  | "stream_ending";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
};

type SerializedNotification = Omit<Notification, "timestamp"> & {
  timestamp: string;
};

function serialize(n: Notification): SerializedNotification {
  return { ...n, timestamp: n.timestamp.toISOString() };
}

function deserialize(raw: SerializedNotification): Notification {
  return { ...raw, timestamp: new Date(raw.timestamp) };
}

const SAMPLE_NOTIFICATIONS: Omit<Notification, "id" | "timestamp" | "read">[] =
  [
    {
      type: "order_shipped",
      title: "Your order has shipped!",
      message:
        "Order #ORD-2401 — Oud Noir Intense (50ml) is on its way. Estimated delivery in 2–3 days.",
      actionUrl: "/my-orders",
      actionLabel: "Track Order",
    },
    {
      type: "bid_outbid",
      title: "You've been outbid",
      message:
        'Someone placed a higher bid on "Rose de Taif — Collector\'s Edition". Current bid: $340.',
      actionUrl: "/auctions",
      actionLabel: "Bid Again",
    },
    {
      type: "trade_offer",
      title: "New trade offer received",
      message:
        "A buyer wants to trade Santal 33 (100ml) for your Baccarat Rouge 540 (70ml).",
      actionUrl: "/trade-offers",
      actionLabel: "View Offer",
    },
    {
      type: "wholesale_approved",
      title: "Wholesale account approved",
      message:
        "Congratulations! Your wholesale application has been approved. You now have access to tiered pricing.",
      actionUrl: "/wholesale",
      actionLabel: "View Tiers",
    },
    {
      type: "stream_started",
      title: "Live stream starting now",
      message:
        'Fragrance House is going live: "Winter Oud Collection Showcase". Join 142 viewers!',
      actionUrl: "/live",
      actionLabel: "Watch Now",
    },
  ];

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function load(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: SerializedNotification[] = JSON.parse(raw);
      return parsed.map(deserialize);
    }
  } catch {
    // fall through to seed
  }
  return [];
}

function save(notifications: Notification[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notifications.map(serialize)),
  );
}

function seedIfEmpty(): void {
  const existing = load();
  if (existing.length > 0) return;

  const now = Date.now();
  const seeded: Notification[] = SAMPLE_NOTIFICATIONS.map((n, i) => ({
    ...n,
    id: generateId(),
    timestamp: new Date(now - (i + 1) * 1000 * 60 * (15 + i * 40)),
    read: false,
  }));
  save(seeded);
}

export function getNotifications(): Notification[] {
  seedIfEmpty();
  const items = load();
  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function markAsRead(notificationId: string): void {
  const items = load();
  const updated = items.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
  save(updated);
}

export function markAllAsRead(): void {
  const items = load();
  save(items.map((n) => ({ ...n, read: true })));
}

export function addNotification(
  n: Omit<Notification, "id" | "timestamp" | "read">,
): Notification {
  const items = load();
  const newNotif: Notification = {
    ...n,
    id: generateId(),
    timestamp: new Date(),
    read: false,
  };
  save([newNotif, ...items]);
  return newNotif;
}

export function getUnreadCount(): number {
  const items = getNotifications();
  return items.filter((n) => !n.read).length;
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}
