import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import React, { useState } from "react";
import ProductGrid from "../components/products/ProductGrid";
import SearchFilters from "../components/products/SearchFilters";
import { type LocalProduct, useSearchProducts } from "../hooks/useQueries";
import type { Product, SearchFilter } from "../types/index";

function localToProduct(p: LocalProduct): Product {
  return {
    id: p.id,
    vendorId: p.storeId, // use storeId so navigation works correctly
    title: p.title,
    description: p.description,
    price: p.price,
    stock: p.stock,
    category: p.category,
    productType: p.productType as any,
    status: p.status as any,
    image: p.image,
    variants: p.variants,
  };
}

export default function ProductListing() {
  const [filter, setFilter] = useState<SearchFilter>({});

  const { data: localProducts, isLoading, error } = useSearchProducts(filter);

  const products: Product[] = (localProducts || []).map(localToProduct);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground mt-1">
            Browse our complete collection of luxury fragrances
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <SearchFilters filter={filter} onFilterChange={setFilter} />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"].map(
                  (k) => (
                    <div key={k} className="space-y-3">
                      <Skeleton className="h-64 w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ),
                )}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Failed to load products. Please try again.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">
                  No products found
                </p>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
                <ProductGrid products={products} isLoading={false} />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
