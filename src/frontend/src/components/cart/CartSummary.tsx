import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import React from "react";
import type { CartItem, Product } from "../../types";
import CartItemRow from "./CartItemRow";

interface CartSummaryProps {
  items: CartItem[];
  products: Product[];
  onCheckout: () => void;
  isLoading?: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function CartSummary({
  items,
  products,
  onCheckout,
  isLoading,
}: CartSummaryProps) {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    if (!product) return sum;
    const variant =
      item.variantIndex !== undefined
        ? product.variants?.[item.variantIndex]
        : null;
    const effectivePrice = variant
      ? product.price + variant.priceAdjustment
      : product.price;
    return sum + effectivePrice * item.quantity;
  }, 0);

  return (
    <div className="space-y-2">
      {/* Item rows */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {items.map((item) => {
          const product = productMap.get(item.productId) ?? null;
          return (
            <div
              key={`${item.productId}-${item.variantIndex ?? "none"}`}
              className="px-4"
            >
              <CartItemRow item={item} product={product} />
            </div>
          );
        })}
      </div>

      {/* Summary card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4 mt-4">
        <h3 className="font-serif text-lg text-foreground">Order Summary</h3>

        <div className="space-y-2">
          {items.map((item) => {
            const product = productMap.get(item.productId);
            const variant =
              product && item.variantIndex !== undefined
                ? product.variants?.[item.variantIndex]
                : null;
            const effectivePrice = product
              ? variant
                ? product.price + variant.priceAdjustment
                : product.price
              : 0;
            const lineTotal = effectivePrice * item.quantity;
            return (
              <div
                key={`${item.productId}-${item.variantIndex ?? "none"}`}
                className="flex justify-between text-sm font-sans"
              >
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {product?.title ?? item.productId} × {item.quantity}
                  {variant ? ` (${variant.name}: ${variant.value})` : ""}
                </span>
                <span className="text-foreground shrink-0">
                  {product ? formatPrice(lineTotal) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between font-sans text-base font-medium">
          <span className="text-foreground">Subtotal</span>
          <span className="text-gold">{formatPrice(subtotal)}</span>
        </div>

        <Button
          onClick={onCheckout}
          disabled={isLoading || items.length === 0}
          className="w-full font-sans bg-gold text-background hover:bg-gold/90"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
