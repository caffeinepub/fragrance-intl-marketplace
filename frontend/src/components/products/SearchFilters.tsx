import React from 'react';
import type { SearchFilter } from '../../types';
import { ProductType, Variant_quantityDesc_priceDesc_priceAsc } from '../../types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchFiltersProps {
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}

const CATEGORIES = [
  'Perfume', 'Cologne', 'Eau de Toilette', 'Eau de Parfum',
  'Body Spray', 'Fragrance Oil', 'Candle', 'Diffuser', 'Other',
];

export default function SearchFilters({ filter, onFilterChange }: SearchFiltersProps) {
  const handleReset = () => {
    onFilterChange({ keyword: null, category: null, productType: null, sortBy: null });
  };

  const hasFilters = filter.keyword || filter.category || filter.productType || filter.sortBy;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={filter.keyword ?? ''}
          onChange={(e) => onFilterChange({ ...filter, keyword: e.target.value || null })}
          placeholder="Search fragrances…"
          className="pl-8 h-9 font-sans text-sm border-border"
        />
      </div>

      <Select
        value={filter.category ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filter, category: v === 'all' ? null : v })}
      >
        <SelectTrigger className="w-40 h-9 font-sans text-sm border-border">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.productType ?? 'all'}
        onValueChange={(v) =>
          onFilterChange({ ...filter, productType: v === 'all' ? null : (v as ProductType) })
        }
      >
        <SelectTrigger className="w-36 h-9 font-sans text-sm border-border">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value={ProductType.physical}>Physical</SelectItem>
          <SelectItem value={ProductType.digital}>Digital</SelectItem>
          <SelectItem value={ProductType.service}>Service</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filter.sortBy ?? 'none'}
        onValueChange={(v) =>
          onFilterChange({
            ...filter,
            sortBy: v === 'none' ? null : (v as 'priceAsc' | 'priceDesc' | 'quantityDesc'),
          })
        }
      >
        <SelectTrigger className="w-40 h-9 font-sans text-sm border-border">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Default Sort</SelectItem>
          <SelectItem value={Variant_quantityDesc_priceDesc_priceAsc.priceAsc}>Price: Low to High</SelectItem>
          <SelectItem value={Variant_quantityDesc_priceDesc_priceAsc.priceDesc}>Price: High to Low</SelectItem>
          <SelectItem value={Variant_quantityDesc_priceDesc_priceAsc.quantityDesc}>Most Available</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
