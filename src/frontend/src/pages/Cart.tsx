import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import React from "react";
import type { Product as BackendProduct } from "../backend";
import type { ProductStatus, ProductType } from "../backend";
import CartSummary from "../components/cart/CartSummary";
import { useGetCart, useGetProduct } from "../hooks/useQueries";
import type { CartItem } from "../types";
import type { Product } from "../types";

function backendToLocalProduct(p: BackendProduct): Product {
  const productType: ProductType =
    typeof p.productType === "object"
      ? (Object.keys(p.productType as object)[0] as unknown as ProductType)
      : p.productType;
  const status: ProductStatus =
    typeof p.status === "object"
      ? (Object.keys(p.status as object)[0] as unknown as ProductStatus)
      : p.status;
  return {
    id: p.id,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    productType,
    stock: Number(p.stock),
    image: p.image ?? null,
    status,
    variants: (p.variants ?? []).map((v) => ({
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stockAdjustment: Number(v.stockAdjustment),
    })),
  };
}

function ProductFetcher({
  storeId,
  productId,
  onResolved,
}: {
  storeId: string;
  productId: string;
  onResolved: (productId: string, product: Product | null) => void;
}) {
  const { data, isFetched } = useGetProduct(storeId, productId);

  React.useEffect(() => {
    if (isFetched) {
      onResolved(productId, data ? backendToLocalProduct(data) : null);
    }
  }, [isFetched, data, productId, onResolved]);

  return null;
}

export default function Cart() {
  const navigate = useNavigate();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const [resolvedProducts, setResolvedProducts] = React.useState<
    Map<string, Product>
  >(new Map());

  const items: CartItem[] = cartItems ?? [];

  const uniqueProductIds = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });
  }, [items]);

  const handleProductResolved = React.useCallback(
    (productId: string, product: Product | null) => {
      if (product) {
        setResolvedProducts((prev) => {
          const next = new Map(prev);
          next.set(productId, product);
          return next;
        });
      }
    },
    [],
  );

  const products = Array.from(resolvedProducts.values());

  if (cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Add some products to get started.
        </p>
        <Button onClick={() => navigate({ to: "/products" })}>
          Browse Products
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {uniqueProductIds.map((item) => {
        const parts = item.productId.split("::");
        const storeId = parts.length >= 2 ? parts[0] : item.productId;
        const productId =
          parts.length >= 2 ? parts.slice(1).join("::") : item.productId;
        return (
          <ProductFetcher
            key={item.productId}
            storeId={storeId}
            productId={productId}
            onResolved={handleProductResolved}
          />
        );
      })}

      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <CartSummary
        items={items}
        products={products}
        onCheckout={() => navigate({ to: "/checkout" })}
      />
    </div>
  );
}
