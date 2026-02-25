import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useQueries';
import { ExternalBlob, ProductType, type Product } from '../../backend';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Eau de Parfum', 'Eau de Toilette', 'Cologne', 'Perfume Oil',
  'Body Mist', 'Candles & Home', 'Accessories', 'Gift Sets', 'Other'
];

interface ProductFormProps {
  vendorId: string;
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ vendorId, product, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? String(Number(product.price) / 100) : '');
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [productType, setProductType] = useState<ProductType>(product?.productType || ProductType.physical);
  const [stock, setStock] = useState(product ? String(Number(product.stock)) : '0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description);
      setPrice(String(Number(product.price) / 100));
      setCategory(product.category);
      setProductType(product.productType);
      setStock(String(Number(product.stock)));
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceInCents = BigInt(Math.round(parseFloat(price) * 100));
    const stockQty = BigInt(parseInt(stock) || 0);

    try {
      let imageBlob: ExternalBlob | null = null;
      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      }

      if (isEdit && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          title: title.trim(),
          description: description.trim(),
          price: priceInCents,
          category,
          productType,
          stock: stockQty,
          image: imageBlob,
        });
        toast.success('Product updated successfully');
      } else {
        const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await createProduct.mutateAsync({
          id,
          vendorId,
          title: title.trim(),
          description: description.trim(),
          price: priceInCents,
          category,
          productType,
          stock: stockQty,
          image: imageBlob,
        });
        toast.success('Product created successfully');
      }
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to save product');
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="font-sans text-sm">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rose Oud Eau de Parfum"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc" className="font-sans text-sm">Description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your fragrance..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="font-sans text-sm">
            Price (USD) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="font-sans text-sm">Product Type</Label>
          <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-sans text-sm">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {productType === ProductType.physical && (
          <div className="space-y-2">
            <Label htmlFor="stock" className="font-sans text-sm">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-sans text-sm">Product Image</Label>
        <label
          htmlFor="product-image"
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gold/40 rounded cursor-pointer hover:bg-gold/5 transition-colors text-sm text-muted-foreground w-fit"
        >
          <Upload className="w-4 h-4" />
          {imageFile ? imageFile.name : 'Choose image'}
        </label>
        <input
          id="product-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        {isPending && imageFile && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="h-1.5" />
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={!title.trim() || !price || isPending}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEdit ? 'Updating...' : 'Creating...'}</>
          ) : (
            isEdit ? 'Update Product' : 'Create Product'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
