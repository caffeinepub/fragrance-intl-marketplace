import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import React from "react";
import { useGetOrder } from "../hooks/useQueries";
import type { LocalOrder } from "../hooks/useQueries";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function OrderReceipt() {
  const { orderId } = useParams({ from: "/orders/$orderId/receipt" });
  const navigate = useNavigate();
  const { data: order, isLoading } = useGetOrder(orderId ?? null);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">
          This order receipt could not be found.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/my-orders" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const typedOrder = order as LocalOrder;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate({ to: "/my-orders" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Order Receipt</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {typedOrder.id}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(typedOrder.createdAt)}
          </p>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3 mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Items
          </h3>
          {typedOrder.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="font-mono text-xs text-muted-foreground">
                {item.productId.slice(0, 12)}…
              </span>
              <span>× {item.quantity}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(typedOrder.total)}</span>
        </div>

        {typedOrder.shippingAddress && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Shipping Address
              </h3>
              <p className="text-sm">{typedOrder.shippingAddress}</p>
            </div>
          </>
        )}

        <Separator className="my-4" />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="capitalize font-medium">{typedOrder.status}</span>
        </div>
      </div>
    </div>
  );
}
