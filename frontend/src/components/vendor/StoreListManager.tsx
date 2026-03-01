import React, { useState } from 'react';
import { useMyStores, useToggleStoreActive } from '../../hooks/useQueries';
import type { StoreResponse } from '../../backend';
import StoreFormModal from './StoreFormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function StoreListManager() {
  const { identity } = useInternetIdentity();
  const vendorId = identity?.getPrincipal();
  const { data: stores = [], isLoading } = useMyStores(vendorId);
  const toggleActive = useToggleStoreActive();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreResponse | undefined>(undefined);

  const handleToggle = async (storeId: string) => {
    try {
      await toggleActive.mutateAsync(storeId);
      toast.success('Store status updated');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update store');
    }
  };

  const openCreate = () => {
    setEditingStore(undefined);
    setModalOpen(true);
  };

  const openEdit = (store: StoreResponse) => {
    setEditingStore(store);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          Add Store
        </Button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No stores yet. Create your first store!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store: StoreResponse) => (
            <div key={store.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{store.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{store.contactInfo}</p>
                </div>
                <Badge variant={store.isActive ? 'default' : 'secondary'}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(store)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(store.id)}
                  disabled={toggleActive.isPending}
                >
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
  );
}
