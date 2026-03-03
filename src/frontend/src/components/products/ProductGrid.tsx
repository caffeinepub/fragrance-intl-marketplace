import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import type { Product } from "../../types/index";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export default function ProductGrid({
  products,
  isLoading = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
          <div key={k} className="space-y-3">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products to display.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products
        .filter((p) => p != null && p.id != null)
        .map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
    </div>
  );
}
