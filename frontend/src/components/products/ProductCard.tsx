import React from 'react';
import type { Product } from '../../types';
import { ProductType } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '../../hooks/useQueries';
import { ShoppingCart, Loader2, Zap, Package, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const typeIcons: Record<string, React.ReactNode> = {
  [ProductType.digital]: <Zap className="w-3 h-3" />,
  [ProductType.physical]: <Package className="w-3 h-3" />,
  [ProductType.service]: <Wrench className="w-3 h-3" />,
};

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();

  const handleAddToCart = async () => {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: BigInt(1) });
      toast.success(`${product.title} added to cart`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  return (
    <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
      <div className="aspect-square bg-muted overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="/assets/generated/product-placeholder.dim_600x600.png"
            alt={product.title}
            className="w-full h-full object-cover opacity-50"
          />
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base text-foreground line-clamp-2">{product.title}</h3>
          <Badge variant="outline" className="text-[10px] shrink-0 flex items-center gap-1 border-border">
            {typeIcons[product.productType]}
            {product.productType}
          </Badge>
        </div>

        {product.description && (
          <p className="font-sans text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-serif text-lg text-gold">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || product.stock === 0}
            className="font-sans text-xs bg-gold text-background hover:bg-gold/90"
          >
            {addToCart.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ShoppingCart className="w-3 h-3 mr-1" />
            )}
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
