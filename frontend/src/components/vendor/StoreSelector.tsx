import React from 'react';
import { useMyStores } from '../../hooks/useQueries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';

interface StoreSelectorProps {
  selectedStoreId: string | null;
  onStoreChange: (storeId: string) => void;
}

export default function StoreSelector({ selectedStoreId, onStoreChange }: StoreSelectorProps) {
  const { data: stores, isLoading } = useMyStores();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Store className="w-4 h-4 text-gold shrink-0" />
        <Skeleton className="h-9 w-56" />
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Store className="w-4 h-4 text-gold shrink-0" />
      <span className="font-sans text-sm text-muted-foreground whitespace-nowrap">Active Store:</span>
      <Select value={selectedStoreId ?? stores[0]?.id} onValueChange={onStoreChange}>
        <SelectTrigger className="w-56 border-border bg-card font-sans text-sm">
          <SelectValue placeholder="Select a store" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[140px]">{store.name}</span>
                <Badge
                  variant={store.isActive ? 'default' : 'secondary'}
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${
                    store.isActive
                      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {store.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
