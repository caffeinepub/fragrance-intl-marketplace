import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Package, Receipt } from "lucide-react";
import React from "react";
import { useGetMyOrders } from "../hooks/useQueries";
import type { LocalOrder } from "../hooks/useQueries";

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

export default function MyOrders() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useGetMyOrders();

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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
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
        {sorted.map((order: LocalOrder) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-muted-foreground mb-1">
                {order.id.slice(0, 14)}…
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.timestamp)} · {order.items.length} item
                {order.items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-semibold">{formatPrice(order.total)}</span>
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
              >
                <Receipt className="h-4 w-4 mr-1" />
                Receipt
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
