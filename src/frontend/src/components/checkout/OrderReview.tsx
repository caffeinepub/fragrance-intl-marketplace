import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, MapPin, Package } from "lucide-react";
import React from "react";
import type { CartItem, Product } from "../../types";

interface OrderReviewProps {
  items: CartItem[];
  products: Product[];
  shippingAddress: string;
  skipShipping?: boolean;
  onPay: () => void;
  isPaying?: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function OrderReview({
  items,
  products,
  shippingAddress,
  skipShipping = false,
  onPay,
  isPaying,
}: OrderReviewProps) {
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
    <div className="space-y-5">
      {/* Items */}
      <div className="space-y-3">
        <h3 className="font-serif text-base text-foreground flex items-center gap-2">
          <Package className="w-4 h-4 text-gold" />
          Order Items
        </h3>
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
          const variantLabel =
            item.variantLabel ??
            (variant ? `${variant.name}: ${variant.value}` : null);

          return (
            <div
              key={`${item.productId}-${item.variantIndex ?? "none"}`}
              className="flex items-center gap-3"
            >
              {/* Product image */}
              <div className="w-12 h-12 bg-muted rounded-lg shrink-0 overflow-hidden border border-border">
                <img
                  src="/assets/generated/product-placeholder.dim_600x600.png"
                  alt={product?.title ?? item.productId}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate font-medium">
                  {product?.title ?? item.productId}
                </p>
                {variantLabel && (
                  <p className="font-sans text-xs text-muted-foreground">
                    {variantLabel}
                  </p>
                )}
                <p className="font-sans text-xs text-muted-foreground">
                  {formatPrice(effectivePrice)} × {item.quantity}
                </p>
              </div>
              <span className="font-sans text-sm font-semibold text-foreground shrink-0">
                {product ? formatPrice(lineTotal) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Shipping address (only for physical orders) */}
      {!skipShipping && shippingAddress && (
        <>
          <div className="space-y-1.5">
            <h3 className="font-serif text-base text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              Shipping Address
            </h3>
            <p className="font-sans text-sm text-muted-foreground whitespace-pre-line">
              {shippingAddress}
            </p>
          </div>
          <Separator />
        </>
      )}

      {skipShipping && (
        <>
          <div className="space-y-1.5">
            <h3 className="font-serif text-base text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              Delivery
            </h3>
            <p className="font-sans text-sm text-muted-foreground">
              Digital delivery — no shipping required.
            </p>
          </div>
          <Separator />
        </>
      )}

      {/* Total */}
      <div className="flex justify-between font-sans text-base font-medium">
        <span className="text-foreground">Total</span>
        <span className="text-gold text-lg font-bold">
          {formatPrice(subtotal)}
        </span>
      </div>

      <Button
        onClick={onPay}
        disabled={isPaying}
        className="w-full font-sans bg-gold text-background hover:bg-gold/90"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting to Payment…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay with Stripe
          </>
        )}
      </Button>
    </div>
  );
}
