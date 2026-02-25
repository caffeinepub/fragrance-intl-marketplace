import React from 'react';
import { type CartItem, type Product } from '../../backend';
import { useAddToCart, useRemoveFromCart, useSearchProducts } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const { data: products, isLoading } = useSearchProducts({});
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();

  const product = products?.find((p) => p.id === item.productId);

  const handleIncrease = async () => {
    try {
      await addToCart.mutateAsync({ productId: item.productId, quantity: BigInt(1) });
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart.mutateAsync(item.productId);
    } catch {
      toast.error('Failed to remove item');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded" />;
  }

  const formatPrice = (price: bigint) => `$${(Number(price) / 100).toFixed(2)}`;
  const lineTotal = product ? formatPrice(product.price * item.quantity) : '—';

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded hover:border-gold/30 transition-colors">
      <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
        <img
          src="/assets/generated/product-placeholder.dim_600x600.png"
          alt={product?.title || item.productId}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-sans font-medium text-foreground truncate">
          {product?.title || item.productId}
        </p>
        {product && (
          <p className="text-sm text-gold font-medium mt-0.5">
            {formatPrice(product.price)} each
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="icon"
          variant="outline"
          className="w-7 h-7 border-gold/30 hover:bg-gold/10"
          onClick={handleRemove}
          disabled={removeFromCart.isPending}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center font-sans text-sm font-medium">
          {Number(item.quantity)}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="w-7 h-7 border-gold/30 hover:bg-gold/10"
          onClick={handleIncrease}
          disabled={addToCart.isPending}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="text-right flex-shrink-0 min-w-[60px]">
        <p className="font-serif text-base text-foreground">{lineTotal}</p>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
        onClick={handleRemove}
        disabled={removeFromCart.isPending}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
