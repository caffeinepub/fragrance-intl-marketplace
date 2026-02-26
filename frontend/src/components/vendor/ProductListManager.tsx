import React, { useState } from 'react';
import type { Product } from '../../types';
import { useSearchProducts, useDeleteProduct } from '../../hooks/useQueries';
import ProductForm from './ProductForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductListManagerProps {
  vendorId: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductListManager({ vendorId }: ProductListManagerProps) {
  const { data: products, isLoading } = useSearchProducts({ keyword: null, category: null, productType: null, sortBy: null });
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const vendorProducts = (products ?? []).filter((p) => p.vendorId === vendorId);

  const openCreate = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-muted-foreground">{vendorProducts.length} product{vendorProducts.length !== 1 ? 's' : ''}</p>
        <Button
          size="sm"
          onClick={openCreate}
          className="font-sans bg-gold text-background hover:bg-gold/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {vendorProducts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded">
          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-sans text-sm text-muted-foreground">No products yet. Add your first product.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vendorProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 bg-background border border-border rounded p-3"
            >
              <div className="w-10 h-10 bg-muted rounded shrink-0 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="w-4 h-4 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">{product.title}</p>
                <p className="font-sans text-xs text-muted-foreground">{product.category}</p>
              </div>
              <span className="font-sans text-sm text-gold font-medium shrink-0">{formatPrice(product.price)}</span>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${product.status === 'active' ? 'border-emerald-500/30 text-emerald-600' : 'border-border text-muted-foreground'}`}
              >
                {product.status}
              </Badge>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(product)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                >
                  {deletingId === product.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-foreground">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            vendorId={vendorId}
            product={editingProduct}
            onSuccess={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
