import React from 'react';
import { type Product, ProductType } from '../../backend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { ShoppingBag, Loader2, Sparkles, Package, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

interface ProductCardProps {
  product: Product;
}

const typeIcons = {
  [ProductType.physical]: Package,
  [ProductType.digital]: Sparkles,
  [ProductType.service]: Wrench,
};

const typeLabels = {
  [ProductType.physical]: 'Physical',
  [ProductType.digital]: 'Digital',
  [ProductType.service]: 'Service',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { identity } = useInternetIdentity();
  const addToCart = useAddToCart();
  const TypeIcon = typeIcons[product.productType];

  const formatPrice = (price: bigint) => `$${(Number(price) / 100).toFixed(2)}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: BigInt(1) });
      toast.success(`${product.title} added to cart`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="group bg-card border border-border rounded overflow-hidden hover:border-gold/40 hover:shadow-luxury transition-all duration-300 animate-fade-in">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src="/assets/generated/product-placeholder.dim_600x600.png"
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="text-xs bg-card/90 backdrop-blur-sm border-gold/20 text-bronze"
          >
            <TypeIcon className="w-3 h-3 mr-1" />
            {typeLabels[product.productType]}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <h3 className="font-serif text-base text-foreground leading-snug line-clamp-2">
            {product.title}
          </h3>
        </div>

        {product.description && (
          <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-serif text-lg text-gold font-medium">
            {formatPrice(product.price)}
          </span>
          {product.productType === ProductType.physical && (
            <span className="text-xs text-muted-foreground font-sans">
              {Number(product.stock) > 0 ? `${Number(product.stock)} in stock` : 'Out of stock'}
            </span>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={
            addToCart.isPending ||
            (product.productType === ProductType.physical && Number(product.stock) === 0)
          }
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9"
        >
          {addToCart.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
