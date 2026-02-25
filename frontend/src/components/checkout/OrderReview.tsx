import React from 'react';
import { type CartItem, type Product, ProductType } from '../../backend';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type ShippingAddress } from './ShippingAddressForm';
import { Loader2, CreditCard, MapPin } from 'lucide-react';

interface OrderReviewProps {
  cartItems: CartItem[];
  products: Product[];
  shippingAddress?: ShippingAddress;
  onPlaceOrder: () => void;
  isPlacing: boolean;
}

export default function OrderReview({
  cartItems,
  products,
  shippingAddress,
  onPlaceOrder,
  isPlacing,
}: OrderReviewProps) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + Number(product.price) * Number(item.quantity);
  }, 0);

  const hasPhysical = cartItems.some((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product?.productType === ProductType.physical;
  });

  const isShippingComplete =
    !hasPhysical ||
    (shippingAddress &&
      shippingAddress.street &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.zip &&
      shippingAddress.country);

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-xl text-foreground">Order Review</h3>

      <div className="space-y-3">
        {cartItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                <img
                  src="/assets/generated/product-placeholder.dim_600x600.png"
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-foreground truncate">{product.title}</p>
                <p className="text-xs text-muted-foreground">Qty: {Number(item.quantity)}</p>
              </div>
              <p className="font-sans text-sm text-foreground flex-shrink-0">
                {formatPrice(Number(product.price) * Number(item.quantity))}
              </p>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between font-serif text-lg">
        <span>Total</span>
        <span className="text-gold">{formatPrice(subtotal)}</span>
      </div>

      {shippingAddress && hasPhysical && (
        <div className="bg-muted/50 rounded p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3" />
            <span className="font-sans uppercase tracking-wider">Shipping to</span>
          </div>
          <p className="font-sans text-sm text-foreground">
            {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip},{' '}
            {shippingAddress.country}
          </p>
        </div>
      )}

      <Button
        onClick={onPlaceOrder}
        disabled={isPlacing || !isShippingComplete}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
      >
        {isPlacing ? (
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

      {!isShippingComplete && hasPhysical && (
        <p className="text-xs text-muted-foreground text-center font-sans">
          Please complete the shipping address to place your order.
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center font-sans">
        You will be redirected to Stripe's secure checkout page to complete your payment.
      </p>
    </div>
  );
}
