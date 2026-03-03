import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type React from "react";
import { useState } from "react";
import type { ProductStatus, ProductType } from "../../backend";
import {
  useAddProductToStore,
  useUpdateStoreProduct,
} from "../../hooks/useQueries";
import type { Product } from "../../types/index";

interface ProductFormProps {
  storeId: string;
  product?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({
  storeId,
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const addProduct = useAddProductToStore();
  const updateProduct = useUpdateStoreProduct();

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? String(Number(product.price) / 100) : "",
  );
  const [stock, setStock] = useState(
    product ? String(Number(product.stock)) : "",
  );
  const [category, setCategory] = useState(product?.category ?? "");
  const [productType, setProductType] = useState<string>(
    product
      ? typeof product.productType === "object"
        ? Object.keys(product.productType as object)[0]
        : String(product.productType)
      : "physical",
  );
  const [error, setError] = useState("");

  const isEditing = !!product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedPrice = Number.parseFloat(price);
    const parsedStock = Number.parseInt(stock, 10);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    const productData = {
      id: product?.id ?? `product-${Date.now()}`,
      vendorId: storeId,
      title,
      description,
      price: BigInt(Math.round(parsedPrice * 100)),
      stock: BigInt(parsedStock),
      category,
      productType: { [productType]: null } as unknown as ProductType,
      status: { active: null } as unknown as ProductStatus,
      variants:
        product?.variants?.map((v) => ({
          name: v.name,
          value: v.value,
          priceAdjustment: BigInt(
            typeof v.priceAdjustment === "bigint"
              ? v.priceAdjustment
              : v.priceAdjustment,
          ),
          stockAdjustment: BigInt(
            typeof v.stockAdjustment === "bigint"
              ? v.stockAdjustment
              : v.stockAdjustment,
          ),
        })) ?? [],
    };

    try {
      if (isEditing) {
        await updateProduct.mutateAsync({ storeId, product: productData });
      } else {
        await addProduct.mutateAsync({ storeId, product: productData });
      }
      onSuccess?.();
    } catch {
      setError("Failed to save product. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="type">Product Type</Label>
        <Select value={productType} onValueChange={setProductType}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={addProduct.isPending || updateProduct.isPending}
        >
          {addProduct.isPending || updateProduct.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          ) : isEditing ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </Button>
      </div>
    </form>
  );
}
