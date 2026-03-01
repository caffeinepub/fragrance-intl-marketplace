import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useGetCart, useGetProduct, useCreateCheckoutSession } from '../hooks/useQueries';
import ShippingAddressForm from '../components/checkout/ShippingAddressForm';
import OrderReview from '../components/checkout/OrderReview';
import type { ShippingAddress } from '../components/checkout/ShippingAddressForm';
import type { CartItem, Product } from '../types';
import type { Product as BackendProduct, ShoppingItem } from '../backend';
import { ProductType, ProductStatus } from '../backend';

function backendToLocalProduct(p: BackendProduct): Product {
  const productType: ProductType =
    typeof p.productType === 'object'
      ? (Object.keys(p.productType as object)[0] as unknown as ProductType)
      : p.productType;
  const status: ProductStatus =
    typeof p.status === 'object'
      ? (Object.keys(p.status as object)[0] as unknown as ProductStatus)
      : p.status;
  return {
    id: p.id,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    productType,
    stock: Number(p.stock),
    image: p.image ?? null,
    status,
    variants: (p.variants ?? []).map((v) => ({
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stockAdjustment: Number(v.stockAdjustment),
    })),
  };
}

function addressToString(address: ShippingAddress): string {
  const parts = [
    address.street,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country,
  ].filter(Boolean);
  return parts.join('\n');
}

function ProductFetcher({
  storeId,
  productId,
  onResolved,
}: {
  storeId: string;
  productId: string;
  onResolved: (productId: string, product: Product | null) => void;
}) {
  const { data, isFetched } = useGetProduct(storeId, productId);

  React.useEffect(() => {
    if (isFetched) {
      onResolved(productId, data ? backendToLocalProduct(data) : null);
    }
  }, [isFetched, data, productId, onResolved]);

  return null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const createCheckoutSession = useCreateCheckoutSession();

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [step, setStep] = useState<'shipping' | 'review'>('shipping');
  const [resolvedProducts, setResolvedProducts] = useState<Map<string, Product>>(new Map());

  const items: CartItem[] = cartItems ?? [];

  const uniqueProductIds = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });
  }, [items]);

  const handleProductResolved = useCallback((productId: string, product: Product | null) => {
    if (product) {
      setResolvedProducts((prev) => {
        const next = new Map(prev);
        next.set(productId, product);
        return next;
      });
    }
  }, []);

  const products = Array.from(resolvedProducts.values());

  const productsResolved =
    uniqueProductIds.length > 0 &&
    uniqueProductIds.every((item) => resolvedProducts.has(item.productId));

  const allDigital =
    productsResolved &&
    items.every((item) => {
      const product = resolvedProducts.get(item.productId);
      if (!product) return false;
      const pt = typeof product.productType === 'object'
        ? Object.keys(product.productType as object)[0]
        : String(product.productType);
      return pt === 'digital' || pt === 'service';
    });

  const skipShipping = productsResolved && allDigital;

  const handleShippingSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    setStep('review');
  };

  const handlePay = async () => {
    const productMap = new Map(products.map((p) => [p.id, p]));

    const shoppingItems: ShoppingItem[] = items.map((item) => {
      const product = productMap.get(item.productId);
      const variant =
        product && item.variantIndex !== undefined
          ? product.variants?.[item.variantIndex]
          : null;
      const effectivePrice = product
        ? variant
          ? product.price + variant.priceAdjustment
          : product.price
        : 0;

      return {
        productName: product?.title ?? item.productId,
        currency: 'usd',
        quantity: BigInt(item.quantity),
        priceInCents: BigInt(effectivePrice),
        productDescription: product?.description ?? '',
      };
    });

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const successUrl = `${baseUrl}/payment-success`;
    const cancelUrl = `${baseUrl}/payment-failure`;

    const session = await createCheckoutSession.mutateAsync({
      items: shoppingItems,
      successUrl,
      cancelUrl,
    });

    if (!session?.url) throw new Error('Stripe session missing url');
    window.location.href = session.url;
  };

  if (cartLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <button
          onClick={() => navigate({ to: '/products' })}
          className="text-primary underline text-sm"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {uniqueProductIds.map((item) => {
        const parts = item.productId.split('::');
        const storeId = parts.length >= 2 ? parts[0] : item.productId;
        const productId = parts.length >= 2 ? parts.slice(1).join('::') : item.productId;
        return (
          <ProductFetcher
            key={item.productId}
            storeId={storeId}
            productId={productId}
            onResolved={handleProductResolved}
          />
        );
      })}

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {step === 'shipping' ? (
        <ShippingAddressForm
          onSubmit={handleShippingSubmit}
          skipShipping={skipShipping}
        />
      ) : (
        <OrderReview
          items={items}
          products={products}
          shippingAddress={shippingAddress ? addressToString(shippingAddress) : ''}
          skipShipping={skipShipping}
          onPay={handlePay}
          isPaying={createCheckoutSession.isPending}
        />
      )}
    </div>
  );
}
