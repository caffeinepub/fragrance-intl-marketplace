import React from 'react';
import type { CartItem, Product } from '../../types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';

interface CartSummaryProps {
  items: CartItem[];
  products: Product[];
  onCheckout: () => void;
  isLoading?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartSummary({ items, products, onCheckout, isLoading }: CartSummaryProps) {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <div className="bg-card border border-border rounded p-5 space-y-4">
      <h3 className="font-serif text-lg text-foreground">Order Summary</h3>

      <div className="space-y-2">
        {items.map((item) => {
          const product = productMap.get(item.productId);
          return (
            <div key={item.productId} className="flex justify-between text-sm font-sans">
              <span className="text-muted-foreground truncate max-w-[180px]">
                {product?.title ?? item.productId} × {item.quantity}
              </span>
              <span className="text-foreground shrink-0">
                {product ? formatPrice(product.price * item.quantity) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between font-sans text-base font-medium">
        <span className="text-foreground">Total</span>
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
  );
}
