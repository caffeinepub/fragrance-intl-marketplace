import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  Gavel,
  Package,
  Radio,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  type Notification,
  type NotificationType,
  clearAll,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../utils/notifications";

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function fullDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NotifIcon({ type }: { type: NotificationType }) {
  const cls = "w-5 h-5";
  switch (type) {
    case "order_placed":
    case "order_shipped":
    case "order_delivered":
      return <Package className={`${cls} text-blue-500`} />;
    case "bid_placed":
    case "bid_outbid":
    case "auction_won":
    case "auction_ended":
      return <Gavel className={`${cls} text-amber-500`} />;
    case "trade_offer":
    case "trade_accepted":
    case "trade_rejected":
      return <ArrowLeftRight className={`${cls} text-green-500`} />;
    case "wholesale_approved":
    case "wholesale_rejected":
      return <Tag className={`${cls} text-purple-500`} />;
    case "review_posted":
      return <Star className={`${cls} text-yellow-500`} />;
    case "stream_started":
    case "stream_ending":
      return <Radio className={`${cls} text-red-500`} />;
    default:
      return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

function typeLabel(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    order_placed: "Order",
    order_shipped: "Order",
    order_delivered: "Order",
    bid_placed: "Auction",
    bid_outbid: "Auction",
    auction_won: "Auction",
    auction_ended: "Auction",
    trade_offer: "Trade",
    trade_accepted: "Trade",
    trade_rejected: "Trade",
    wholesale_approved: "Other",
    wholesale_rejected: "Other",
    review_posted: "Other",
    stream_started: "Other",
    stream_ending: "Other",
  };
  return map[type] ?? "Other";
}

type FilterTab = "all" | "unread" | "orders" | "auctions" | "trade" | "other";

function filterNotifications(
  notifications: Notification[],
  tab: FilterTab,
): Notification[] {
  switch (tab) {
    case "unread":
      return notifications.filter((n) => !n.read);
    case "orders":
      return notifications.filter((n) => typeLabel(n.type) === "Order");
    case "auctions":
      return notifications.filter((n) => typeLabel(n.type) === "Auction");
    case "trade":
      return notifications.filter((n) => typeLabel(n.type) === "Trade");
    case "other":
      return notifications.filter((n) => typeLabel(n.type) === "Other");
    default:
      return notifications;
  }
}

function EmptyState({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, { title: string; desc: string }> = {
    all: { title: "No notifications yet", desc: "You're all caught up!" },
    unread: {
      title: "No unread notifications",
      desc: "All caught up — nothing new to see.",
    },
    orders: {
      title: "No order notifications",
      desc: "Order updates will appear here.",
    },
    auctions: {
      title: "No auction notifications",
      desc: "Bid and auction alerts will appear here.",
    },
    trade: {
      title: "No trade notifications",
      desc: "Trade offer updates will appear here.",
    },
    other: {
      title: "No other notifications",
      desc: "Platform and stream alerts will appear here.",
    },
  };
  const { title, desc } = messages[tab];
  return (
    <div
      className="py-16 text-center border border-dashed border-border rounded-xl"
      data-ocid="notifications_page.empty_state"
    >
      <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-serif text-lg text-foreground mb-1">{title}</p>
      <p className="font-sans text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const refresh = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    refresh();
  };

  const handleClearAll = () => {
    clearAll();
    refresh();
  };

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    refresh();
  };

  const filtered = filterNotifications(notifications, activeTab);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
            Activity
          </p>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
            <BellRing className="w-7 h-7 text-primary" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="font-sans text-sm text-muted-foreground mt-1">
              You have{" "}
              <span className="text-primary font-semibold">{unreadCount}</span>{" "}
              unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="font-sans gap-2"
              onClick={handleMarkAllRead}
              data-ocid="notifications_page.mark_all_read_button"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="font-sans gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleClearAll}
            data-ocid="notifications_page.clear_all_button"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FilterTab)}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 mb-6">
          <TabsTrigger
            value="all"
            className="text-xs"
            data-ocid="notifications_page.all_tab"
          >
            All
            {notifications.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 px-1.5 py-0 text-[10px] h-4"
              >
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="text-xs"
            data-ocid="notifications_page.unread_tab"
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1.5 px-1.5 py-0 text-[10px] h-4 bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">
            Orders
          </TabsTrigger>
          <TabsTrigger value="auctions" className="text-xs">
            Auctions
          </TabsTrigger>
          <TabsTrigger value="trade" className="text-xs">
            Trade
          </TabsTrigger>
          <TabsTrigger value="other" className="text-xs">
            Other
          </TabsTrigger>
        </TabsList>

        {(
          [
            "all",
            "unread",
            "orders",
            "auctions",
            "trade",
            "other",
          ] as FilterTab[]
        ).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            {filtered.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="space-y-1" data-ocid="notifications_page.list">
                {filtered.map((n, i) => (
                  <div
                    key={n.id}
                    className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      !n.read
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/8"
                        : "bg-card border-border hover:bg-muted/30"
                    }`}
                    data-ocid={`notifications_page.item.${i + 1}`}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <span className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className="mt-0.5 p-2.5 bg-muted rounded-full flex-shrink-0">
                      <NotifIcon type={n.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-sans text-sm font-semibold text-foreground">
                          {n.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {typeLabel(n.type)}
                        </Badge>
                      </div>
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>
                      <p
                        className="font-sans text-xs text-muted-foreground/70 mt-1.5"
                        title={fullDate(n.timestamp)}
                      >
                        {relativeTime(n.timestamp)} · {fullDate(n.timestamp)}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2.5">
                        {n.actionUrl && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="font-sans text-xs h-7 px-2.5 gap-1"
                          >
                            <Link to={n.actionUrl as any}>
                              {n.actionLabel ?? "View"}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </Button>
                        )}
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-sans text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
