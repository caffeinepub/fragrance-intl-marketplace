import React, { useState } from 'react';
import type { Product } from '../../types';
import { ProductType } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '../../hooks/useQueries';
import { ShoppingCart, Loader2, Zap, Package, Wrench, ChevronDown } from 'lucide-react';
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
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(
    hasVariants ? 0 : null,
  );

  const selectedVariant =
    selectedVariantIndex !== null && hasVariants
      ? product.variants[selectedVariantIndex]
      : null;

  const displayPrice = selectedVariant
    ? product.price + selectedVariant.priceAdjustment
    : product.price;

  const effectiveStock = selectedVariant
    ? product.stock + selectedVariant.stockAdjustment
    : product.stock;

  const handleAddToCart = async () => {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: BigInt(1) });
      const variantLabel = selectedVariant
        ? ` (${selectedVariant.name}: ${selectedVariant.value})`
        : '';
      toast.success(`${product.title}${variantLabel} added to cart`);
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
          <Badge
            variant="outline"
            className="text-[10px] shrink-0 flex items-center gap-1 border-border"
          >
            {typeIcons[product.productType]}
            {product.productType}
          </Badge>
        </div>

        {product.description && (
          <p className="font-sans text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Variant selector */}
        {hasVariants && (
          <div className="space-y-1.5">
            <label className="font-sans text-xs text-muted-foreground">
              {product.variants[0]?.name ?? 'Variant'}
            </label>
            <div className="relative">
              <select
                value={selectedVariantIndex ?? 0}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className="w-full appearance-none bg-background border border-border rounded px-3 py-1.5 font-sans text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
              >
                {product.variants.map((variant, idx) => (
                  <option key={idx} value={idx}>
                    {variant.value}
                    {variant.priceAdjustment !== 0
                      ? ` (${variant.priceAdjustment > 0 ? '+' : ''}${formatPrice(variant.priceAdjustment)})`
                      : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="font-serif text-lg text-gold">{formatPrice(displayPrice)}</span>
            {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
              <span className="font-sans text-[10px] text-muted-foreground">
                Base: {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || effectiveStock === 0}
            className="font-sans text-xs bg-gold text-background hover:bg-gold/90"
          >
            {addToCart.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ShoppingCart className="w-3 h-3 mr-1" />
            )}
            {effectiveStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
