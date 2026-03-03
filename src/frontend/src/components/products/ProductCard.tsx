import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Eye, ShoppingCart } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAddToCart } from "../../hooks/useQueries";
import type { Product } from "../../types/index";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | undefined
  >(undefined);
  const [imageError, setImageError] = useState(false);

  // Safely get variants array
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;

  // Auto-select the first variant when the card mounts and has variants
  useEffect(() => {
    if (hasVariants && selectedVariantIndex === undefined) {
      setSelectedVariantIndex(0);
    }
  }, [hasVariants, selectedVariantIndex]);

  // Calculate effective price and stock based on selected variant
  const selectedVariant =
    selectedVariantIndex !== undefined
      ? variants[selectedVariantIndex]
      : undefined;
  const basePrice =
    typeof product.price === "number" ? product.price : Number(product.price);
  const baseStock =
    typeof product.stock === "number" ? product.stock : Number(product.stock);

  const effectivePrice = selectedVariant
    ? basePrice + Number(selectedVariant.priceAdjustment)
    : basePrice;

  const effectiveStock = selectedVariant
    ? baseStock + Number(selectedVariant.stockAdjustment)
    : baseStock;

  const inStock = effectiveStock > 0;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Build image URL from Principal (blob storage)
  const getImageUrl = (): string | null => {
    if (!product.image || imageError) return null;
    try {
      const principalStr =
        typeof product.image === "object" && "toString" in product.image
          ? product.image.toString()
          : String(product.image);
      if (!principalStr || principalStr === "undefined") return null;
      return `/api/v2/canister/${principalStr}/http_request`;
    } catch {
      return null;
    }
  };

  const imageUrl = getImageUrl();

  const handleAddToCart = async () => {
    if (!inStock) return;
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: 1,
        variantIndex: selectedVariantIndex,
        variantLabel: selectedVariant
          ? `${selectedVariant.name}: ${selectedVariant.value}`
          : undefined,
      });
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  const handleViewDetails = () => {
    // vendorId on the local Product is set to storeId in the conversion functions
    const storeId = product.vendorId;
    if (storeId && product.id) {
      navigate({
        to: "/products/$storeId/$productId",
        params: { storeId, productId: product.id },
      });
    }
  };

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title || "Product"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src="/assets/generated/product-placeholder.dim_600x600.png"
            alt={product.title || "Product"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Out-of-stock overlay — reacts to selected variant */}
        {!inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Quick View Button */}
        <button
          type="button"
          onClick={handleViewDetails}
          className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
          aria-label="View details"
        >
          <Eye className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category || "Fragrance"}
          </p>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 leading-snug">
            {product.title || "Untitled Product"}
          </h3>

          {/* Variant Selector — selecting updates price and stock immediately */}
          {hasVariants && (
            <div className="mb-3">
              <select
                value={
                  selectedVariantIndex !== undefined
                    ? String(selectedVariantIndex)
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVariantIndex(val === "" ? undefined : Number(val));
                }}
                className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {variants.map((v, i) => {
                  const vStock = baseStock + Number(v.stockAdjustment);
                  const vPrice = basePrice + Number(v.priceAdjustment);
                  return (
                    <option
                      key={`${v.name}-${v.value}`}
                      value={String(i)}
                      disabled={vStock <= 0}
                    >
                      {v.name}: {v.value} — {formatPrice(vPrice)}
                      {vStock <= 0 ? " (Out of Stock)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Price and Actions — both update dynamically on variant change */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-primary">
                {formatPrice(effectivePrice)}
              </span>
              {selectedVariant &&
                Number(selectedVariant.priceAdjustment) !== 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(basePrice)}
                  </span>
                )}
            </div>
            <span
              className={`text-xs font-medium ${inStock ? "text-green-600" : "text-destructive"}`}
            >
              {inStock ? `${effectiveStock} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleViewDetails}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!inStock || addToCart.isPending}
            >
              {addToCart.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              )}
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
