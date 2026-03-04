import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Download, Package } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useGetOrder } from "../hooks/useQueries";
import {
  type DigitalEntitlement,
  createEntitlements,
  getEntitlements,
} from "../utils/digitalDelivery";

export default function OrderConfirmation() {
  const { orderId } = useParams({ from: "/order-confirmation/$orderId" });
  const navigate = useNavigate();
  const { data: order } = useGetOrder(orderId ?? undefined);
  const [digitalEntitlements, setDigitalEntitlements] = useState<
    DigitalEntitlement[]
  >([]);

  // Once order is loaded, attempt to create entitlements for digital items
  useEffect(() => {
    if (!orderId) return;

    if (order?.items && order.items.length > 0) {
      // Try to get product details from localStorage cart snapshot
      const cartRaw = localStorage.getItem("last_cart_items");
      let cartItems: Array<{
        productId: string;
        storeId: string;
        title: string;
        productType: string;
      }> = [];

      if (cartRaw) {
        try {
          cartItems = JSON.parse(cartRaw);
        } catch {
          // ignore parse errors
        }
      }

      // Map order items to entitlement input — use cart snapshot where available
      const entitlementInput = order.items.map((item) => {
        const cartMatch = cartItems.find((c) => c.productId === item.productId);
        return {
          productId: item.productId,
          storeId: cartMatch?.storeId ?? "",
          title: cartMatch?.title ?? item.productId,
          productType: cartMatch?.productType ?? "",
        };
      });

      const created = createEntitlements(orderId, entitlementInput);
      setDigitalEntitlements(created);
    } else {
      // Fallback: check if we already have entitlements for this order
      const existing = getEntitlements(orderId);
      setDigitalEntitlements(existing);
    }
  }, [orderId, order]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-muted-foreground mb-2">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      {orderId && (
        <p className="font-mono text-sm text-muted-foreground mb-8">
          Order ID: {orderId}
        </p>
      )}

      {/* Digital Downloads Ready section */}
      {digitalEntitlements.length > 0 && (
        <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-serif text-lg text-foreground">
              Your Downloads Are Ready
            </h2>
          </div>
          <p className="font-sans text-sm text-muted-foreground mb-3">
            The following digital items are available to download immediately:
          </p>
          <ul className="space-y-1.5 mb-4">
            {digitalEntitlements.map((ent) => (
              <li
                key={ent.id}
                className="flex items-center gap-2 font-sans text-sm text-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{ent.productTitle}</span>
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {ent.fileType}
                </span>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans gap-2"
            onClick={() => navigate({ to: "/my-downloads" })}
          >
            <Download className="w-4 h-4" />
            Go to My Downloads
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => navigate({ to: "/my-orders" })}>
          <Package className="mr-2 h-4 w-4" />
          View My Orders
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/products" })}>
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
