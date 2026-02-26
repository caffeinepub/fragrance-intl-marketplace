import React, { useState, useEffect } from 'react';
import { ExternalBlob } from '../../backend';
import { ProductType } from '../../types';
import type { Product } from '../../types';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormProps {
  vendorId: string;
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ vendorId, product, onSuccess, onCancel }: ProductFormProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    productType: ProductType.physical as ProductType,
    stock: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description,
        price: (product.price / 100).toFixed(2),
        category: product.category,
        productType: product.productType,
        stock: String(product.stock),
        imageUrl: product.image ?? '',
      });
    }
  }, [product]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);

    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          title: form.title.trim(),
          description: form.description.trim(),
          price: BigInt(Math.round(price * 100)),
          category: form.category.trim(),
          productType: form.productType,
          stock: BigInt(isNaN(stock) ? 0 : stock),
          image: null,
        });
        toast.success('Product updated!');
      } else {
        const id = `product_${Date.now()}`;
        await createProduct.mutateAsync({
          id,
          vendorId,
          title: form.title.trim(),
          description: form.description.trim(),
          price: BigInt(Math.round(price * 100)),
          category: form.category.trim(),
          productType: form.productType,
          stock: BigInt(isNaN(stock) ? 0 : stock),
          image: null,
        });
        toast.success('Product created!');
      }
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

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
            className="font-sans text-sm border-border"
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
            className="font-sans text-sm border-border"
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
          className="font-sans text-sm border-border resize-none"
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
            className="font-sans text-sm border-border"
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
            className="font-sans text-sm border-border"
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
            <SelectTrigger className="font-sans text-sm border-border">
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

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Image URL</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="font-sans text-sm border-border"
          disabled={isPending}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="font-sans border-border"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="font-sans bg-gold text-background hover:bg-gold/90"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
