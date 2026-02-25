import React from 'react';
import { useGetCart, useSearchProducts } from '../hooks/useQueries';
import CartItemRow from '../components/cart/CartItemRow';
import CartSummary from '../components/cart/CartSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';

export default function Cart() {
  const { identity } = useInternetIdentity();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: products, isLoading: productsLoading } = useSearchProducts({});

  if (!identity) {
    return <AccessDenied message="Please sign in to view your cart." />;
  }

  const isLoading = cartLoading || productsLoading;

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Shopping</p>
        <h1 className="font-serif text-3xl text-foreground">Your Cart</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded" />)}
        </div>
      ) : !cartItems || cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-14 h-14 text-muted-foreground opacity-20 mb-5" />
          <h2 className="font-serif text-2xl text-foreground mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground font-sans mb-6">
            Discover our curated collection of luxury fragrances.
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>
          <div>
            <CartSummary cartItems={cartItems} products={products || []} />
          </div>
        </div>
      )}
    </main>
  );
}
