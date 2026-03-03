import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import type { StoreResponse } from "../../backend";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useMyStores } from "../../hooks/useQueries";

interface StoreSelectorProps {
  selectedStoreId?: string;
  onSelect: (storeId: string) => void;
}

export default function StoreSelector({
  selectedStoreId,
  onSelect,
}: StoreSelectorProps) {
  const { identity } = useInternetIdentity();
  const vendorId = identity?.getPrincipal();
  const { data: stores = [], isLoading } = useMyStores(vendorId);

  if (isLoading) {
    return <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />;
  }

  if (stores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No stores available.</p>
    );
  }

  return (
    <Select value={selectedStoreId ?? ""} onValueChange={onSelect}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store: StoreResponse) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
