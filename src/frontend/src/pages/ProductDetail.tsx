import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { Product } from "../backend";
import { useAddToCart, useGetProduct } from "../hooks/useQueries";

function formatPrice(price: bigint | number): string {
  const num = typeof price === "bigint" ? Number(price) : price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num / 100);
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-40 mt-4" />
          <Skeleton className="h-12 w-full mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams({ strict: false }) as {
    storeId?: string;
    productId?: string;
  };
  const navigate = useNavigate();
  const storeId = params.storeId ?? undefined;
  const productId = params.productId ?? undefined;

  const {
    data: product,
    isLoading,
    isError,
  } = useGetProduct(storeId, productId);
  const addToCart = useAddToCart();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const typedProduct = product as Product | null | undefined;
  const variants = typedProduct?.variants ?? [];
  const hasVariants = variants.length > 0;

  // Auto-select the first variant when product loads and has variants
  useEffect(() => {
    if (hasVariants && selectedVariantIndex === null) {
      setSelectedVariantIndex(0);
    }
  }, [hasVariants, selectedVariantIndex]);

  const selectedVariant =
    selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;

  const basePrice = typedProduct ? Number(typedProduct.price) : 0;
  const effectivePrice = selectedVariant
    ? basePrice + Number(selectedVariant.priceAdjustment)
    : basePrice;

  const baseStock = typedProduct ? Number(typedProduct.stock) : 0;
  const effectiveStock = selectedVariant
    ? baseStock + Number(selectedVariant.stockAdjustment)
    : baseStock;

  const inStock = effectiveStock > 0;

  const productTypeLabel = typedProduct
    ? typeof typedProduct.productType === "object"
      ? Object.keys(typedProduct.productType as object)[0]
      : String(typedProduct.productType)
    : "";

  const statusLabel = typedProduct
    ? typeof typedProduct.status === "object"
      ? Object.keys(typedProduct.status as object)[0]
      : String(typedProduct.status)
    : "";

  const handleAddToCart = async () => {
    if (!typedProduct) return;
    if (hasVariants && selectedVariantIndex === null) return;

    await addToCart.mutateAsync({
      productId: typedProduct.id,
      quantity: 1,
      variantIndex: selectedVariantIndex ?? undefined,
      variantLabel: selectedVariant
        ? `${selectedVariant.name}: ${selectedVariant.value}`
        : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !typedProduct) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          This product may have been removed or the link is incorrect.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/products" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Products
        </Button>
      </div>
    );
  }

  const imageUrl = typedProduct.image
    ? `/api/v2/canister/${typedProduct.image.toString()}/http_request`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate({ to: "/products" })}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={typedProduct.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/assets/generated/product-placeholder.dim_600x600.png"
              alt={typedProduct.title}
              className="w-full h-full object-cover opacity-70"
            />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs capitalize">
                {productTypeLabel}
              </Badge>
              {statusLabel !== "active" && (
                <Badge variant="secondary" className="text-xs">
                  Unavailable
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {typedProduct.title}
            </h1>
            {typedProduct.category && (
              <p className="text-sm text-muted-foreground mt-1">
                {typedProduct.category}
              </p>
            )}
          </div>

          {/* Dynamic price — updates immediately on variant change */}
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold text-primary">
              {formatPrice(effectivePrice)}
            </div>
            {selectedVariant &&
              Number(selectedVariant.priceAdjustment) !== 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(basePrice)}
                </span>
              )}
          </div>

          {typedProduct.description && (
            <p className="text-muted-foreground leading-relaxed">
              {typedProduct.description}
            </p>
          )}

          <Separator />

          {/* Variant Selector */}
          {hasVariants && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Select Option
              </p>
              <Select
                value={
                  selectedVariantIndex !== null
                    ? String(selectedVariantIndex)
                    : ""
                }
                onValueChange={(val) => setSelectedVariantIndex(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option…" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant, idx) => {
                    const vStock = baseStock + Number(variant.stockAdjustment);
                    const vPrice = basePrice + Number(variant.priceAdjustment);
                    return (
                      <SelectItem
                        key={`${variant.name}-${variant.value}`}
                        value={String(idx)}
                        disabled={vStock <= 0}
                      >
                        {variant.name}: {variant.value} — {formatPrice(vPrice)}
                        {vStock <= 0 ? " (Out of Stock)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dynamic stock — updates immediately on variant change */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                inStock ? "text-green-600" : "text-destructive"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`}
              />
              {inStock ? `${effectiveStock} in stock` : "Out of stock"}
            </span>
            {selectedVariant && (
              <span className="text-xs text-muted-foreground">
                for {selectedVariant.name}: {selectedVariant.value}
              </span>
            )}
          </div>

          {/* Out-of-stock notice */}
          {!inStock && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              This option is currently out of stock. Please select a different
              variant or check back later.
            </p>
          )}

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              addToCart.isPending ||
              (hasVariants && selectedVariantIndex === null)
            }
          >
            {addToCart.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Adding…
              </span>
            ) : addedToCart ? (
              "✓ Added to Cart!"
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {!inStock
                  ? "Out of Stock"
                  : hasVariants && selectedVariantIndex === null
                    ? "Select an Option"
                    : "Add to Cart"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
