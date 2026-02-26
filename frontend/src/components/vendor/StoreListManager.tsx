import React, { useState } from 'react';
import { useMyStores, useToggleStoreActive } from '../../hooks/useQueries';
import StoreFormModal from './StoreFormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StoreResponse } from '../../backend';
import { Plus, Pencil, ToggleLeft, ToggleRight, Store, Loader2 } from 'lucide-react';

const MAX_STORES = 5;

export default function StoreListManager() {
  const { data: stores, isLoading } = useMyStores();
  const toggleStoreActive = useToggleStoreActive();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreResponse | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const storeCount = stores?.length ?? 0;
  const atLimit = storeCount >= MAX_STORES;

  const openCreate = () => {
    setEditingStore(undefined);
    setModalOpen(true);
  };

  const openEdit = (store: StoreResponse) => {
    setEditingStore(store);
    setModalOpen(true);
  };

  const handleToggleActive = async (store: StoreResponse) => {
    setTogglingId(store.id);
    try {
      await toggleStoreActive.mutateAsync(store.id);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="font-sans text-sm text-muted-foreground">
            {storeCount} / {MAX_STORES} stores
          </p>
          {atLimit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled
                    size="sm"
                    className="font-sans bg-gold text-background opacity-50 cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Store
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-sans text-xs">
                You've reached the maximum of {MAX_STORES} stores per vendor account.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              size="sm"
              onClick={openCreate}
              className="font-sans bg-gold text-background hover:bg-gold/90"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Store
            </Button>
          )}
        </div>

        {/* Store cards */}
        {!stores || stores.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded">
            <Store className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-sans text-sm text-muted-foreground">
              No stores yet. Create your first store to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-background border border-border rounded p-4 flex flex-col gap-3"
              >
                {/* Store header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-base text-foreground truncate">{store.name}</p>
                      {store.contactInfo && (
                        <p className="font-sans text-xs text-muted-foreground truncate">
                          {store.contactInfo}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={store.isActive ? 'default' : 'secondary'}
                    className={`shrink-0 text-xs ${
                      store.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {store.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Description */}
                {store.description && (
                  <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                    {store.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(store)}
                    className="font-sans text-xs border-border h-7 px-2.5"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(store)}
                    disabled={togglingId === store.id}
                    className={`font-sans text-xs h-7 px-2.5 ${
                      store.isActive
                        ? 'border-amber-500/40 text-amber-600 hover:bg-amber-500/10'
                        : 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10'
                    }`}
                  >
                    {togglingId === store.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : store.isActive ? (
                      <ToggleLeft className="w-3 h-3 mr-1" />
                    ) : (
                      <ToggleRight className="w-3 h-3 mr-1" />
                    )}
                    {store.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <StoreFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          store={editingStore}
        />
      </div>
    </TooltipProvider>
  );
}
