import React, { useState } from 'react';
import { useGetCart, useSearchProducts, usePlaceOrder, useCreateStripeCheckoutSession } from '../hooks/useQueries';
import { ProductType } from '../types';
import ShippingAddressForm, { type ShippingAddress } from '../components/checkout/ShippingAddressForm';
import OrderReview from '../components/checkout/OrderReview';
import { Skeleton } from '@/components/ui/skeleton';
import { buildSuccessUrl, buildCancelUrl } from '../utils/stripe';
import { toast } from 'sonner';

function addressToString(addr: ShippingAddress): string {
  return [addr.street, addr.city, addr.state, addr.zip, addr.country]
    .filter(Boolean)
    .join(', ');
}

export default function Checkout() {
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: products, isLoading: productsLoading } = useSearchProducts({
    keyword: null, category: null, productType: null, sortBy: null,
  });
  const placeOrder = usePlaceOrder();
  const createCheckoutSession = useCreateStripeCheckoutSession();

  const [step, setStep] = useState<'shipping' | 'review'>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | undefined>(undefined);
  const [isPaying, setIsPaying] = useState(false);

  const isLoading = cartLoading || productsLoading;
  const items = cartItems ?? [];
  const productList = products ?? [];

  const hasPhysical = items.some((item) => {
    const product = productList.find((p) => p.id === item.productId);
    return product?.productType === ProductType.physical;
  });

  const handleShippingSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    setStep('review');
  };

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const addressStr = shippingAddress ? addressToString(shippingAddress) : 'Digital delivery';
      // placeOrder is stubbed — use a placeholder orderId for now
      const orderId = `order_${Date.now()}`;
      const session = await createCheckoutSession.mutateAsync({
        orderId,
        successUrl: buildSuccessUrl(orderId),
        cancelUrl: buildCancelUrl(orderId),
      });
      if (!session?.url) throw new Error('Stripe session missing url');
      window.location.href = session.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-6">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Checkout</p>
        <h1 className="font-serif text-3xl text-foreground">
          {step === 'shipping' ? 'Shipping Details' : 'Review Order'}
        </h1>
      </div>

      <div className="bg-card border border-border rounded p-6">
        {step === 'shipping' ? (
          <ShippingAddressForm
            onSubmit={handleShippingSubmit}
            skipShipping={!hasPhysical}
          />
        ) : (
          <OrderReview
            items={items}
            products={productList}
            shippingAddress={shippingAddress ? addressToString(shippingAddress) : 'Digital delivery'}
            onPay={handlePay}
            isPaying={isPaying}
          />
        )}
      </div>
    </main>
  );
}
