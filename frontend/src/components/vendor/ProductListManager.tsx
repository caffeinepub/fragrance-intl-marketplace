import React, { useState } from 'react';
import { useSearchProducts, useDeleteProduct } from '../../hooks/useQueries';
import { type Product } from '../../backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProductForm from './ProductForm';
import { Edit2, Trash2, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ProductListManagerProps {
  vendorId: string;
}

export default function ProductListManager({ vendorId }: ProductListManagerProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: products, isLoading } = useSearchProducts({ keyword: undefined, category: undefined, productType: undefined, sortBy: undefined });
  const deleteProduct = useDeleteProduct();

  const vendorProducts = products?.filter((p) => p.vendorId === vendorId) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const formatPrice = (price: bigint) => {
    return `$${(Number(price) / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-sans">
          {vendorProducts.length} product{vendorProducts.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {vendorProducts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gold/30 rounded">
          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-sans text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendorProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 rounded border border-border bg-card hover:border-gold/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src="/assets/generated/product-placeholder.dim_600x600.png"
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-sans font-medium text-foreground truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gold font-medium">{formatPrice(product.price)}</span>
                    <Badge variant="outline" className="text-xs border-gold/30 text-bronze">
                      {product.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {product.productType}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingProduct(product)}
                  className="w-8 h-8 hover:bg-gold/10"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{product.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            vendorId={vendorId}
            onSuccess={() => setShowAddForm(false)}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              vendorId={vendorId}
              product={editingProduct}
              onSuccess={() => setEditingProduct(null)}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
