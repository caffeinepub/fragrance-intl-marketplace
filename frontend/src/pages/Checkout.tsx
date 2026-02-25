import React, { useState } from 'react';
import { useGetCart, useSearchProducts, usePlaceOrder, useCreateStripeCheckoutSession } from '../hooks/useQueries';
import ShippingAddressForm, { type ShippingAddress } from '../components/checkout/ShippingAddressForm';
import OrderReview from '../components/checkout/OrderReview';
import { ProductType } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { buildSuccessUrl, buildCancelUrl } from '../utils/stripe';

export default function Checkout() {
  const { identity } = useInternetIdentity();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: products, isLoading: productsLoading } = useSearchProducts({});
  const placeOrder = usePlaceOrder();
  const createStripeSession = useCreateStripeCheckoutSession();

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  if (!identity) {
    return <AccessDenied message="Please sign in to proceed to checkout." />;
  }

  const isLoading = cartLoading || productsLoading;

  const hasPhysical = (cartItems || []).some((item) => {
    const product = (products || []).find((p) => p.id === item.productId);
    return product?.productType === ProductType.physical;
  });

  const isProcessing = placeOrder.isPending || createStripeSession.isPending;

  const handlePlaceOrder = async () => {
    const addressStr = hasPhysical
      ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}, ${shippingAddress.country}`
      : 'Digital/Service — No shipping required';

    try {
      // Step 1: Place the order and get an orderId
      const orderId = await placeOrder.mutateAsync(addressStr);

      // Step 2: Create a Stripe Checkout Session for the order
      const successUrl = buildSuccessUrl(orderId);
      const cancelUrl = buildCancelUrl(orderId);

      const session = await createStripeSession.mutateAsync({
        orderId,
        successUrl,
        cancelUrl,
      });

      // Step 3: Redirect to Stripe hosted checkout page
      window.location.href = session.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-serif text-2xl text-foreground mb-2">Your cart is empty</h2>
        <p className="font-sans text-muted-foreground mb-6">Add some items before checking out.</p>
        <Button asChild variant="outline">
          <Link to="/products">Browse Products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="font-serif text-3xl text-foreground mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Shipping */}
        {hasPhysical && (
          <section>
            <ShippingAddressForm
              address={shippingAddress}
              onChange={setShippingAddress}
            />
          </section>
        )}

        {/* Right: Order Review */}
        <section className={!hasPhysical ? 'lg:col-span-2 max-w-lg mx-auto w-full' : ''}>
          <OrderReview
            cartItems={cartItems}
            products={products || []}
            shippingAddress={hasPhysical ? shippingAddress : undefined}
            onPlaceOrder={handlePlaceOrder}
            isPlacing={isProcessing}
          />
        </section>
      </div>
    </main>
  );
}
