import React from 'react';
import type { CartItem, Product } from '../../types';
import { ProductType } from '../../types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Loader2, MapPin, Package } from 'lucide-react';

interface OrderReviewProps {
  items: CartItem[];
  products: Product[];
  shippingAddress: string;
  onPay: () => void;
  isPaying?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderReview({
  items,
  products,
  shippingAddress,
  onPay,
  isPaying,
}: OrderReviewProps) {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
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
          return (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded shrink-0 overflow-hidden">
                {product?.image ? (
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">
                  {product?.title ?? item.productId}
                </p>
                <p className="font-sans text-xs text-muted-foreground">
                  {product?.productType === ProductType.digital ? 'Digital' : 'Physical'} ×{item.quantity}
                </p>
              </div>
              <span className="font-sans text-sm text-foreground shrink-0">
                {product ? formatPrice(product.price * item.quantity) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Shipping */}
      <div className="space-y-1.5">
        <h3 className="font-serif text-base text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold" />
          Shipping Address
        </h3>
        <p className="font-sans text-sm text-muted-foreground whitespace-pre-line">{shippingAddress}</p>
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between font-sans text-base font-medium">
        <span className="text-foreground">Total</span>
        <span className="text-gold">{formatPrice(subtotal)}</span>
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
