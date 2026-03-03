import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import React from "react";
import { ProductType, type SearchFilter } from "../../types";

interface SearchFiltersProps {
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}

export default function SearchFilters({
  filter,
  onFilterChange,
}: SearchFiltersProps) {
  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-xs gap-1"
        >
          <X className="w-3 h-3" />
          Reset
        </Button>
      </div>

      {/* Keyword Search */}
      <div>
        <label
          htmlFor="search-keyword"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block"
        >
          Search
        </label>
        <Input
          id="search-keyword"
          placeholder="Search products…"
          value={filter.keyword ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filter, keyword: e.target.value || undefined })
          }
          className="h-8 text-sm"
        />
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Category
        </p>
        <Select
          value={filter.category ?? "all"}
          onValueChange={(v) =>
            onFilterChange({ ...filter, category: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Perfume">Perfume</SelectItem>
            <SelectItem value="Cologne">Cologne</SelectItem>
            <SelectItem value="Body Spray">Body Spray</SelectItem>
            <SelectItem value="Candle">Candle</SelectItem>
            <SelectItem value="Diffuser">Diffuser</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Type */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Type
        </p>
        <Select
          value={filter.productType ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              ...filter,
              productType: v === "all" ? undefined : (v as ProductType),
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ProductType.physical}>Physical</SelectItem>
            <SelectItem value={ProductType.digital}>Digital</SelectItem>
            <SelectItem value={ProductType.service}>Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Sort By
        </p>
        <Select
          value={filter.sortBy ?? "none"}
          onValueChange={(v) =>
            onFilterChange({
              ...filter,
              sortBy:
                v === "none"
                  ? undefined
                  : (v as "priceAsc" | "priceDesc" | "quantityDesc"),
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default</SelectItem>
            <SelectItem value="priceAsc">Price: Low to High</SelectItem>
            <SelectItem value="priceDesc">Price: High to Low</SelectItem>
            <SelectItem value="quantityDesc">Most Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
