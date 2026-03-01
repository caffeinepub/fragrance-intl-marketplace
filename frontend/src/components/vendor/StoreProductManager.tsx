import React, { useState } from 'react';
import type { ProductVariant } from '../../types';
import { ProductType } from '../../types';
import {
  useListStoreProducts,
  useAddProductToStore,
  useUpdateStoreProduct,
  useDeleteStoreProduct,
} from '../../hooks/useQueries';
import type { Product as BackendProduct } from '../../backend';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Package, X, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface StoreProductManagerProps {
  storeId: string;
  vendorId: string;
}

interface ProductFormState {
  title: string;
  description: string;
  price: string;
  category: string;
  productType: ProductType;
  stock: string;
}

interface VariantFormRow {
  name: string;
  value: string;
  priceAdjustment: string;
  stockAdjustment: string;
}

const emptyForm = (): ProductFormState => ({
  title: '',
  description: '',
  price: '',
  category: '',
  productType: ProductType.physical,
  stock: '',
});

const emptyVariantRow = (): VariantFormRow => ({
  name: '',
  value: '',
  priceAdjustment: '0',
  stockAdjustment: '0',
});

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return 'You do not have permission to manage products for this store.';
    }
    return err.message;
  }
  return 'An unexpected error occurred.';
}

/** Convert a backend Product to display-friendly values */
function backendProductToDisplay(p: BackendProduct): {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  productType: string;
  stock: number;
  image: string | null;
  status: string;
  variants: ProductVariant[];
} {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    productType: typeof p.productType === 'object'
      ? Object.keys(p.productType as object)[0]
      : String(p.productType),
    stock: Number(p.stock),
    image: p.image ? p.image.toString() : null,
    status: typeof p.status === 'object'
      ? Object.keys(p.status as object)[0]
      : String(p.status),
    variants: (p.variants ?? []).map(v => ({
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stockAdjustment: Number(v.stockAdjustment),
    })),
  };
}

/** Build a backend Product from form data */
function buildBackendProduct(
  id: string,
  vendorId: string,
  form: ProductFormState,
  variants: ProductVariant[],
  existingImage?: string | null,
): BackendProduct {
  return {
    id,
    vendorId,
    title: form.title.trim(),
    description: form.description.trim(),
    price: BigInt(Math.round(parseFloat(form.price) * 100)),
    category: form.category.trim(),
    productType: { [form.productType]: null } as unknown as BackendProduct['productType'],
    stock: BigInt(parseInt(form.stock, 10) || 0),
    image: undefined,
    status: { active: null } as unknown as BackendProduct['status'],
    variants: variants.map(v => ({
      name: v.name,
      value: v.value,
      priceAdjustment: BigInt(Math.round(v.priceAdjustment)),
      stockAdjustment: BigInt(Math.round(v.stockAdjustment)),
    })),
  };
}

interface DisplayProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  productType: string;
  stock: number;
  image: string | null;
  status: string;
  variants: ProductVariant[];
}

interface InlineProductFormProps {
  storeId: string;
  vendorId: string;
  product?: DisplayProduct;
  onSuccess: () => void;
  onCancel: () => void;
}

function InlineProductForm({
  storeId,
  vendorId,
  product,
  onSuccess,
  onCancel,
}: InlineProductFormProps) {
  const addProduct = useAddProductToStore();
  const updateProduct = useUpdateStoreProduct();

  const [form, setForm] = useState<ProductFormState>(() => {
    if (product) {
      return {
        title: product.title,
        description: product.description,
        price: (product.price / 100).toFixed(2),
        category: product.category,
        productType: product.productType as ProductType,
        stock: String(product.stock),
      };
    }
    return emptyForm();
  });

  const [variantRows, setVariantRows] = useState<VariantFormRow[]>(() => {
    if (product && product.variants && product.variants.length > 0) {
      return product.variants.map((v) => ({
        name: v.name,
        value: v.value,
        priceAdjustment: String(v.priceAdjustment),
        stockAdjustment: String(v.stockAdjustment),
      }));
    }
    return [];
  });

  const handleChange = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (index: number, field: keyof VariantFormRow, value: string) => {
    setVariantRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddVariantRow = () => {
    setVariantRows((prev) => [...prev, emptyVariantRow()]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariantRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.category.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    for (let i = 0; i < variantRows.length; i++) {
      const row = variantRows[i];
      if (!row.name.trim() || !row.value.trim()) {
        toast.error(`Variant ${i + 1}: name and value are required`);
        return;
      }
    }

    const variants: ProductVariant[] = variantRows.map((row) => ({
      name: row.name.trim(),
      value: row.value.trim(),
      priceAdjustment: Math.round(parseFloat(row.priceAdjustment || '0') * 100),
      stockAdjustment: parseInt(row.stockAdjustment || '0', 10) || 0,
    }));

    const productId = product?.id ?? `product_${Date.now()}`;
    const backendProduct = buildBackendProduct(productId, vendorId, form, variants, product?.image);

    try {
      if (product) {
        await updateProduct.mutateAsync({ storeId, product: backendProduct });
        toast.success('Product updated successfully');
      } else {
        await addProduct.mutateAsync({ storeId, product: backendProduct });
        toast.success('Product added successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'UNAUTHORIZED') {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Product title"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g. Perfume"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your product…"
          rows={3}
          className="resize-none"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            Price ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">Stock</Label>
          <Input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
            placeholder="0"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">Type</Label>
          <Select
            value={form.productType}
            onValueChange={(v) => handleChange('productType', v)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ProductType.physical}>Physical</SelectItem>
              <SelectItem value={ProductType.digital}>Digital</SelectItem>
              <SelectItem value={ProductType.service}>Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold" />
            <Label className="font-sans text-sm font-medium">
              Variants
              {variantRows.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  ({variantRows.length})
                </span>
              )}
            </Label>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddVariantRow}
            disabled={isPending}
            className="font-sans text-xs h-7 px-2 border-border"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Variant
          </Button>
        </div>

        {variantRows.length === 0 ? (
          <p className="font-sans text-xs text-muted-foreground italic">
            No variants — product will be sold as a single option.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_100px_80px_32px] gap-2 px-1">
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">Name</span>
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">Value</span>
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">Price Adj ($)</span>
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">Stock Adj</span>
              <span />
            </div>
            {variantRows.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_100px_80px_32px] gap-2 items-center">
                <Input
                  value={row.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  placeholder="e.g. Size"
                  className="h-8 text-sm"
                  disabled={isPending}
                />
                <Input
                  value={row.value}
                  onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                  placeholder="e.g. 50ml"
                  className="h-8 text-sm"
                  disabled={isPending}
                />
                <Input
                  type="number"
                  step="0.01"
                  value={row.priceAdjustment}
                  onChange={(e) => handleVariantChange(index, 'priceAdjustment', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm"
                  disabled={isPending}
                />
                <Input
                  type="number"
                  step="1"
                  value={row.stockAdjustment}
                  onChange={(e) => handleVariantChange(index, 'stockAdjustment', e.target.value)}
                  placeholder="0"
                  className="h-8 text-sm"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveVariantRow(index)}
                  disabled={isPending}
                  title="Remove variant"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gold text-background hover:bg-gold/90"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}

export default function StoreProductManager({ storeId, vendorId }: StoreProductManagerProps) {
  const { data: rawProducts, isLoading, isError } = useListStoreProducts(storeId);
  const deleteProduct = useDeleteStoreProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DisplayProduct | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<DisplayProduct | null>(null);

  // Convert backend products to display format
  const products: DisplayProduct[] = (rawProducts ?? []).map(p =>
    backendProductToDisplay(p as BackendProduct)
  );

  const handleAddClick = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (product: DisplayProduct) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingProduct(undefined);
  };

  const handleFormCancel = () => {
    setDialogOpen(false);
    setEditingProduct(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync({ storeId, productId: deleteTarget.id });
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'UNAUTHORIZED') {
        toast.error(getErrorMessage(err));
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gold" />
          <h3 className="font-serif text-lg text-foreground">Store Products</h3>
          {products.length > 0 && (
            <Badge variant="secondary" className="font-sans text-xs">
              {products.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAddClick}
          className="bg-gold text-background hover:bg-gold/90 font-sans"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-destructive font-sans text-sm">
          Failed to load products. Please try again.
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-sans text-sm text-muted-foreground">No products yet.</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">
            Click "Add Product" to add your first product to this store.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-sans text-xs uppercase tracking-wide">Title</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide">Category</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide">Type</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide text-right">Price</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide text-right">Stock</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide text-center">Variants</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wide text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-sans text-sm font-medium">{product.title}</TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">{product.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-sans text-xs capitalize">
                      {product.productType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-sans text-sm text-right text-gold">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="font-sans text-sm text-right">{product.stock}</TableCell>
                  <TableCell className="text-center">
                    {product.variants.length > 0 ? (
                      <Badge variant="secondary" className="font-sans text-xs">
                        {product.variants.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(product)}
                        title="Edit product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleFormCancel(); }}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-foreground">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              {editingProduct ? 'Update the product details below.' : 'Fill in the details for your new product.'}
            </DialogDescription>
          </DialogHeader>
          <InlineProductForm
            storeId={storeId}
            vendorId={vendorId}
            product={editingProduct}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
