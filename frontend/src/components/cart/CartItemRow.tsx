import React from 'react';
import type { CartItem, Product } from '../../types';
import { useRemoveFromCart } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface CartItemRowProps {
  item: CartItem;
  product?: Product;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartItemRow({ item, product }: CartItemRowProps) {
  const removeFromCart = useRemoveFromCart();

  const lineTotal = product ? formatPrice(product.price * item.quantity) : '—';

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-12 h-12 bg-muted rounded shrink-0 overflow-hidden">
        {product?.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-foreground truncate">{product?.title ?? item.productId}</p>
        <p className="font-sans text-xs text-muted-foreground">
          Qty: {item.quantity} × {product ? formatPrice(product.price) : '—'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-sans text-sm font-medium text-foreground">{lineTotal}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => removeFromCart.mutate(item.productId)}
          disabled={removeFromCart.isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
