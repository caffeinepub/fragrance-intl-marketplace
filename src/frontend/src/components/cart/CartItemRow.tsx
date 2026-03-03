import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import React from "react";
import { useRemoveFromCart } from "../../hooks/useQueries";
import type { CartItem, Product } from "../../types";

interface CartItemRowProps {
  item: CartItem;
  product?: Product | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function CartItemRow({ item, product }: CartItemRowProps) {
  const removeFromCart = useRemoveFromCart();

  const basePrice = product?.price ?? 0;
  const variant =
    product && item.variantIndex !== undefined
      ? product.variants?.[item.variantIndex]
      : null;
  const effectivePrice = variant
    ? basePrice + variant.priceAdjustment
    : basePrice;
  const lineTotal = effectivePrice * item.quantity;

  const variantLabel =
    item.variantLabel ?? (variant ? `${variant.name}: ${variant.value}` : null);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {/* Product image thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
        <img
          src="/assets/generated/product-placeholder.dim_600x600.png"
          alt={product?.title ?? item.productId}
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {product?.title ?? (
            <span className="font-mono text-xs">
              {item.productId.slice(0, 20)}…
            </span>
          )}
        </p>
        {variantLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{variantLabel}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatPrice(effectivePrice)} × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-foreground">
          {product ? formatPrice(lineTotal) : "—"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() =>
            removeFromCart.mutate({
              productId: item.productId,
              variantIndex: item.variantIndex,
            })
          }
          disabled={removeFromCart.isPending}
        >
          {removeFromCart.isPending ? (
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
