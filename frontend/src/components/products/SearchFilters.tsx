import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProductType, Variant_quantityDesc_priceDesc_priceAsc, type SearchFilter } from '../../backend';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  'Eau de Parfum', 'Eau de Toilette', 'Cologne', 'Perfume Oil',
  'Body Mist', 'Candles & Home', 'Accessories', 'Gift Sets', 'Other'
];

interface SearchFiltersProps {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
}

export default function SearchFilters({ filter, onChange }: SearchFiltersProps) {
  const hasActiveFilters = filter.keyword || filter.category || filter.productType || filter.sortBy;

  const clearFilters = () => {
    onChange({ keyword: undefined, category: undefined, productType: undefined, sortBy: undefined });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-gold flex-shrink-0" />
        <span className="font-sans text-sm font-medium text-foreground">Filter & Sort</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={filter.keyword || ''}
          onChange={(e) => onChange({ ...filter, keyword: e.target.value || undefined })}
          placeholder="Search fragrances..."
          className="pl-9 border-border focus:border-gold"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          value={filter.category || 'all'}
          onValueChange={(v) => onChange({ ...filter, category: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.productType || 'all'}
          onValueChange={(v) =>
            onChange({ ...filter, productType: v === 'all' ? undefined : (v as ProductType) })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ProductType.physical}>Physical</SelectItem>
            <SelectItem value={ProductType.digital}>Digital</SelectItem>
            <SelectItem value={ProductType.service}>Service</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.sortBy || 'none'}
          onValueChange={(v) =>
            onChange({
              ...filter,
              sortBy: v === 'none' ? undefined : (v as Variant_quantityDesc_priceDesc_priceAsc),
            })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Sort by Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default Order</SelectItem>
            <SelectItem value={Variant_quantityDesc_priceDesc_priceAsc.priceAsc}>Price: Low to High</SelectItem>
            <SelectItem value={Variant_quantityDesc_priceDesc_priceAsc.priceDesc}>Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
