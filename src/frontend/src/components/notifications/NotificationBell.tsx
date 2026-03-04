import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Bell,
  BellRing,
  CheckCheck,
  Gavel,
  Package,
  Radio,
  Star,
  Tag,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  type Notification,
  type NotificationType,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../../utils/notifications";

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

function NotifIcon({ type }: { type: NotificationType }) {
  const cls = "w-4 h-4 flex-shrink-0";
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

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    const all = getNotifications();
    setNotifications(all.slice(0, 8));
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 30s for new notifications
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    refresh();
  };

  const handleNotifClick = (n: Notification) => {
    markAsRead(n.id);
    refresh();
    setOpen(false);
    if (n.actionUrl) {
      navigate({ to: n.actionUrl as any });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          data-ocid="notifications.bell_button"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        data-ocid="notifications.popover"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-serif text-sm font-semibold text-foreground">
            Notifications
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleMarkAllRead}
                data-ocid="notifications.mark_all_read_button"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-sans text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            {notifications.map((n, i) => (
              <button
                key={n.id}
                type="button"
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/40 last:border-b-0 flex items-start gap-3 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotifClick(n)}
                data-ocid={`notifications.item.${i + 1}`}
              >
                <div className="mt-0.5 p-1.5 bg-muted rounded-full flex-shrink-0">
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-xs font-semibold text-foreground leading-snug truncate">
                      {n.title}
                    </p>
                    <span className="font-sans text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {relativeTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </ScrollArea>
        )}

        <Separator />

        {/* Footer */}
        <div className="px-4 py-2.5 text-center">
          <Link
            to="/notifications"
            className="font-sans text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
            data-ocid="notifications.view_all_link"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
