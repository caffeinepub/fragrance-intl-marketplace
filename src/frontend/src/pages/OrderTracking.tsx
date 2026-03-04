import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import {
  type Shipment,
  type ShipmentStatus,
  getShipment,
} from "../utils/shipping";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ShipmentStatus,
  {
    label: string;
    icon: React.ReactNode;
    badgeClass: string;
    dotClass: string;
    description: string;
  }
> = {
  created: {
    label: "Shipment Created",
    icon: <Package className="w-5 h-5" />,
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
    description: "Your shipment has been created and is awaiting pickup.",
  },
  in_transit: {
    label: "In Transit",
    icon: <Truck className="w-5 h-5" />,
    badgeClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
    description: "Your package is on its way to you.",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: <Truck className="w-5 h-5" />,
    badgeClass:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-500",
    description: "Your package is out for delivery today.",
  },
  delivered: {
    label: "Delivered",
    icon: <PackageCheck className="w-5 h-5" />,
    badgeClass:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
    dotClass: "bg-green-500",
    description: "Your package has been successfully delivered.",
  },
  exception: {
    label: "Delivery Exception",
    icon: <AlertTriangle className="w-5 h-5" />,
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
    description:
      "There was an issue with your delivery. Please contact support.",
  },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

// ── Progress bar steps ─────────────────────────────────────────────────────────

const PROGRESS_STEPS: ShipmentStatus[] = [
  "created",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

function TrackingProgressBar({ status }: { status: ShipmentStatus }) {
  if (status === "exception") return null;

  const currentIdx = PROGRESS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full my-6">
      {PROGRESS_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isActive = idx === currentIdx;
        const config = STATUS_CONFIG[step];

        return (
          <React.Fragment key={step}>
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                  isDone
                    ? `${config.dotClass} border-transparent text-white`
                    : "bg-muted border-border text-muted-foreground",
                  isActive ? "ring-4 ring-primary/20 scale-110" : "",
                ].join(" ")}
              >
                {isDone ? (
                  idx < currentIdx ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    config.icon
                  )
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={[
                  "font-sans text-[10px] text-center max-w-[64px] leading-tight",
                  isDone
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < PROGRESS_STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-1 rounded transition-all",
                  idx < currentIdx ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Event timeline ─────────────────────────────────────────────────────────────

function TrackingTimeline({ shipment }: { shipment: Shipment }) {
  const events = [...shipment.events].reverse();

  return (
    <div data-ocid="order_tracking.timeline" className="space-y-0">
      {events.map((event, idx) => {
        const isFirst = idx === 0;

        return (
          <motion.div
            key={`${event.timestamp.toISOString()}-${idx}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.3 }}
            className="flex gap-4 relative"
          >
            {/* Vertical line connector */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={[
                  "w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 z-10",
                  isFirst
                    ? "bg-primary border-primary"
                    : "bg-muted border-border",
                ].join(" ")}
              />
              {idx < events.length - 1 && (
                <div className="w-px flex-1 bg-border/60 my-1 min-h-[24px]" />
              )}
            </div>

            {/* Event content */}
            <div className="pb-5 flex-1 min-w-0">
              <p
                className={[
                  "font-sans text-sm font-medium",
                  isFirst ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {event.description}
              </p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
                <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(event.timestamp)}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function TrackingNotFound({ trackingNumber }: { trackingNumber: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
        <Package className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="font-serif text-2xl text-foreground mb-2">
        Shipment Not Found
      </h2>
      <p className="font-sans text-sm text-muted-foreground mb-2">
        No shipment found for tracking number:
      </p>
      <p className="font-mono text-sm font-semibold text-foreground bg-muted rounded-lg px-3 py-1.5 inline-block mb-6">
        {trackingNumber}
      </p>
      <p className="font-sans text-xs text-muted-foreground mb-8">
        This tracking number may not be valid, or the shipment may not have been
        created yet. Try shipping an order from the "My Orders" page.
      </p>
      <Button asChild variant="outline" data-ocid="order_tracking.back_button">
        <Link to="/my-orders">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Orders
        </Link>
      </Button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrderTracking() {
  const { trackingNumber } = useParams({ strict: false }) as {
    trackingNumber: string;
  };
  const [shipment, setShipment] = useState<Shipment | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (trackingNumber) {
      const found = getShipment(trackingNumber);
      setShipment(found);
    }
  }, [trackingNumber]);

  // Loading
  if (shipment === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-sans text-sm text-muted-foreground">
            Looking up shipment…
          </p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return <TrackingNotFound trackingNumber={trackingNumber ?? ""} />;
  }

  const statusConfig = STATUS_CONFIG[shipment.status];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        data-ocid="order_tracking.back_button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Orders
      </Link>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 mb-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-widest mb-1">
              {shipment.carrier}
            </p>
            <h1 className="font-serif text-3xl text-foreground">
              Track Shipment
            </h1>
          </div>
          <Badge
            className={[
              "text-sm px-3 py-1.5 border rounded-full font-sans flex items-center gap-2",
              statusConfig.badgeClass,
            ].join(" ")}
            data-ocid="order_tracking.status_badge"
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Tracking number */}
        <div
          className="flex items-center gap-3 bg-muted/60 rounded-xl px-4 py-3"
          data-ocid="order_tracking.tracking_number"
        >
          <Truck className="w-5 h-5 text-gold shrink-0" />
          <div className="min-w-0">
            <p className="font-sans text-xs text-muted-foreground">
              Tracking Number
            </p>
            <p className="font-mono text-sm font-bold text-foreground truncate">
              {shipment.trackingNumber}
            </p>
          </div>
        </div>

        {/* Status description */}
        <p className="font-sans text-sm text-muted-foreground">
          {statusConfig.description}
        </p>
      </motion.div>

      {/* Shipment meta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-sans text-xs text-muted-foreground mb-1">
            Service
          </p>
          <p className="font-sans text-sm font-semibold text-foreground">
            {shipment.serviceName}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-sans text-xs text-muted-foreground mb-1">
            Shipped
          </p>
          <p className="font-sans text-sm font-semibold text-foreground">
            {formatShortDate(shipment.createdAt)}
          </p>
        </div>
        {shipment.estimatedDelivery && (
          <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="font-sans text-xs text-muted-foreground mb-1">
              Est. Delivery
            </p>
            <p
              className={[
                "font-sans text-sm font-semibold",
                shipment.status === "delivered"
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground",
              ].join(" ")}
            >
              {shipment.status === "delivered"
                ? "Delivered ✓"
                : formatShortDate(shipment.estimatedDelivery)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-5 mb-6"
      >
        <TrackingProgressBar status={shipment.status} />
      </motion.div>

      {/* Tracking timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <h2 className="font-serif text-lg text-foreground mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" />
          Tracking History
        </h2>
        {shipment.events.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground text-center py-6">
            No tracking events yet.
          </p>
        ) : (
          <TrackingTimeline shipment={shipment} />
        )}
      </motion.div>

      {/* Order reference */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-4 text-center"
      >
        <p className="font-sans text-xs text-muted-foreground">
          Order ID:{" "}
          <span className="font-mono text-foreground">{shipment.orderId}</span>
        </p>
      </motion.div>
    </main>
  );
}
