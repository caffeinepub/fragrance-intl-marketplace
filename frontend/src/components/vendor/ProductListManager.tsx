import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useListStoreProducts, useDeleteStoreProduct } from '../../hooks/useQueries';
import ProductForm from './ProductForm';
import type { Product } from '../../types/index';

interface ProductListManagerProps {
  storeId: string;
}

function formatPrice(price: number | bigint): string {
  const num = typeof price === 'bigint' ? Number(price) : price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num / 100);
}

export default function ProductListManager({ storeId }: ProductListManagerProps) {
  const { data: products, isLoading } = useListStoreProducts(storeId);
  const deleteProduct = useDeleteStoreProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct.mutateAsync({ storeId, productId });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Products</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <ProductForm storeId={storeId} onSuccess={() => setAddOpen(false)} onCancel={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {(products ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No products yet. Add your first product!</p>
      ) : (
        <div className="space-y-2">
          {(products ?? []).map((product) => {
            const p = product as unknown as Product;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                </div>
                {p.variants && p.variants.length > 0 && (
                  <Badge variant="outline" className="text-xs">{p.variants.length} variants</Badge>
                )}
                <div className="flex gap-1">
                  <Dialog open={editingProduct?.id === p.id} onOpenChange={(open) => !open && setEditingProduct(null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingProduct(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                      </DialogHeader>
                      <ProductForm
                        storeId={storeId}
                        product={editingProduct}
                        onSuccess={() => setEditingProduct(null)}
                        onCancel={() => setEditingProduct(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
