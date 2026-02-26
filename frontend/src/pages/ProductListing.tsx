import React, { useState } from 'react';
import type { SearchFilter } from '../types';
import { useSearchProducts } from '../hooks/useQueries';
import SearchFilters from '../components/products/SearchFilters';
import ProductGrid from '../components/products/ProductGrid';

export default function ProductListing() {
  const [filter, setFilter] = useState<SearchFilter>({
    keyword: null,
    category: null,
    productType: null,
    sortBy: null,
  });

  const { data: products, isLoading } = useSearchProducts(filter);

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Shop</p>
        <h1 className="font-serif text-3xl text-foreground">All Fragrances</h1>
      </div>

      <div className="mb-6">
        <SearchFilters filter={filter} onFilterChange={setFilter} />
      </div>

      <ProductGrid products={products ?? []} isLoading={isLoading} />
    </main>
  );
}
