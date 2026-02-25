import React, { useState } from 'react';
import SearchFilters from '../components/products/SearchFilters';
import ProductGrid from '../components/products/ProductGrid';
import { useSearchProducts } from '../hooks/useQueries';
import { type SearchFilter } from '../backend';

export default function ProductListing() {
  const [filter, setFilter] = useState<SearchFilter>({});
  const { data: products, isLoading } = useSearchProducts(filter);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Marketplace</p>
        <h1 className="font-serif text-3xl text-foreground">All Fragrances</h1>
      </div>

      <div className="mb-8 p-5 bg-card border border-border rounded">
        <SearchFilters filter={filter} onChange={setFilter} />
      </div>

      <ProductGrid products={products} isLoading={isLoading} />
    </main>
  );
}
