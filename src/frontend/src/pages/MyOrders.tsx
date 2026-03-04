import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { Download, Eye, Package, Receipt, Truck } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGetMyOrders } from "../hooks/useQueries";
import type { LocalOrder } from "../hooks/useQueries";
import { getAllEntitlements } from "../utils/digitalDelivery";
import {
  type Shipment,
  type ShippingRate,
  createShipment,
  formatShippingPrice,
  getAllShipments,
  getShippingRates,
} from "../utils/shipping";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ── Ship Order Dialog ─────────────────────────────────────────────────────────

interface ShipOrderDialogProps {
  order: LocalOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShipmentCreated: (shipment: Shipment) => void;
}

function ShipOrderDialog({
  order,
  open,
  onOpenChange,
  onShipmentCreated,
}: ShipOrderDialogProps) {
  const rates = getShippingRates("110001", "", 500);
  const [selectedRate, setSelectedRate] = useState<ShippingRate>(rates[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    try {
      const shipment = createShipment(
        order.id,
        selectedRate.serviceCode,
        selectedRate.serviceName,
        selectedRate.estimatedDays,
      );
      toast.success(`Shipment created — Tracking: ${shipment.trackingNumber}`);
      onShipmentCreated(shipment);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create shipment. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="my_orders.ship_dialog">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold" />
            Create Shipment
          </DialogTitle>
          <DialogDescription className="font-sans text-sm">
            Select a UPS India service level for order{" "}
            <span className="font-mono text-xs text-foreground">
              {order.id.slice(0, 14)}…
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {rates.map((rate) => (
            <button
              key={rate.serviceCode}
              type="button"
              onClick={() => setSelectedRate(rate)}
              className={[
                "w-full text-left rounded-xl border p-3 transition-all cursor-pointer",
                selectedRate.serviceCode === rate.serviceCode
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border bg-card hover:bg-muted/30",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {rate.serviceName}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Est. {rate.estimatedDays}{" "}
                    {rate.estimatedDays === 1 ? "day" : "days"}
                  </p>
                </div>
                <span className="font-sans text-sm font-bold text-foreground">
                  {formatShippingPrice(rate.priceInCents)}
                </span>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-sans"
            data-ocid="my_orders.ship_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="font-sans bg-primary hover:bg-primary/90"
            data-ocid="my_orders.ship_confirm_button"
          >
            {isCreating ? "Creating…" : "Create Shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyOrders() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useGetMyOrders();

  // Track which orders have shipments (from localStorage)
  const [shipmentMap, setShipmentMap] = useState<Map<string, Shipment>>(
    new Map(),
  );
  const [shipDialogOrder, setShipDialogOrder] = useState<LocalOrder | null>(
    null,
  );

  // Load existing shipments from localStorage on mount
  useEffect(() => {
    const all = getAllShipments();
    const map = new Map<string, Shipment>();
    for (const s of all) {
      map.set(s.orderId, s);
    }
    setShipmentMap(map);
  }, []);

  const handleShipmentCreated = (shipment: Shipment) => {
    setShipmentMap((prev) => {
      const next = new Map(prev);
      next.set(shipment.orderId, shipment);
      return next;
    });
  };

  // Build a set of orderIds that have digital entitlements
  const [digitalOrderIds, setDigitalOrderIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const entitlements = getAllEntitlements();
    const ids = new Set(entitlements.map((e) => e.orderId));
    setDigitalOrderIds(ids);
  }, []);

  const sorted = [...(orders ?? [])].sort(
    (a: LocalOrder, b: LocalOrder) => b.createdAt - a.createdAt,
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        data-ocid="my_orders.empty_state"
      >
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">
          Your order history will appear here.
        </p>
        <Button onClick={() => navigate({ to: "/products" })}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-4">
        {sorted.map((order: LocalOrder, idx: number) => {
          const shipment = shipmentMap.get(order.id);
          const ocidIdx = idx + 1;

          return (
            <div
              key={order.id}
              data-ocid={`my_orders.item.${ocidIdx}`}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Order info row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-muted-foreground mb-1">
                    {order.id.slice(0, 14)}…
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.timestamp)} · {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <span className="font-semibold">
                    {formatPrice(order.total)}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigate({
                        to: "/orders/$orderId/receipt",
                        params: { orderId: order.id },
                      })
                    }
                    data-ocid={`my_orders.view_button.${ocidIdx}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/orders/$orderId/receipt",
                        params: { orderId: order.id },
                      })
                    }
                    data-ocid={`my_orders.receipt_button.${ocidIdx}`}
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    Receipt
                  </Button>
                  {digitalOrderIds.has(order.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      onClick={() => navigate({ to: "/my-downloads" })}
                      data-ocid={`my_orders.downloads_button.${ocidIdx}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Downloads
                    </Button>
                  )}
                </div>
              </div>

              {/* Shipping row */}
              <div className="flex items-center gap-3 flex-wrap border-t border-border/50 pt-3">
                {shipment ? (
                  <>
                    {/* Shipment exists — show tracking */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Truck className="w-4 h-4 text-gold shrink-0" />
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-muted-foreground">
                          {shipment.serviceName}
                        </p>
                        <p className="font-mono text-xs text-foreground truncate">
                          {shipment.trackingNumber}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={[
                        "text-xs capitalize shrink-0",
                        shipment.status === "delivered"
                          ? "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10"
                          : shipment.status === "in_transit" ||
                              shipment.status === "out_for_delivery"
                            ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                            : "",
                      ].join(" ")}
                    >
                      {shipment.status.replace(/_/g, " ")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/tracking/$trackingNumber",
                          params: {
                            trackingNumber: shipment.trackingNumber,
                          },
                        })
                      }
                      className="shrink-0 font-sans text-xs"
                      data-ocid={`my_orders.track_button.${ocidIdx}`}
                    >
                      <Truck className="h-3.5 w-3.5 mr-1.5" />
                      Track
                    </Button>
                  </>
                ) : (
                  <>
                    {/* No shipment yet */}
                    <div className="flex items-center gap-2 flex-1">
                      <Truck className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      <p className="font-sans text-xs text-muted-foreground">
                        Not yet shipped
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShipDialogOrder(order)}
                      className="shrink-0 font-sans text-xs"
                      data-ocid={`my_orders.ship_button.${ocidIdx}`}
                    >
                      <Truck className="h-3.5 w-3.5 mr-1.5" />
                      Ship Order
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ship order dialog */}
      {shipDialogOrder && (
        <ShipOrderDialog
          order={shipDialogOrder}
          open={!!shipDialogOrder}
          onOpenChange={(open) => {
            if (!open) setShipDialogOrder(null);
          }}
          onShipmentCreated={handleShipmentCreated}
        />
      )}
    </div>
  );
}
