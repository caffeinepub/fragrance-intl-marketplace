import React from 'react';
import { useGetCart, useSearchProducts } from '../hooks/useQueries';
import CartItemRow from '../components/cart/CartItemRow';
import CartSummary from '../components/cart/CartSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';

export default function Cart() {
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: products, isLoading: productsLoading } = useSearchProducts({
    keyword: null, category: null, productType: null, sortBy: null,
  });
  const navigate = useNavigate();

  const isLoading = cartLoading || productsLoading;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    );
  }

  const items = cartItems ?? [];
  const productList = products ?? [];

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-4xl text-center">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Your Cart is Empty</h1>
        <p className="font-sans text-sm text-muted-foreground mb-6">
          Browse our collection and add some fragrances to your cart.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 font-sans text-sm text-gold hover:underline"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-6">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Shopping</p>
        <h1 className="font-serif text-3xl text-foreground">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {items.map((item) => {
            const product = productList.find((p) => p.id === item.productId);
            return <CartItemRow key={item.productId} item={item} product={product} />;
          })}
        </div>
        <CartSummary
          items={items}
          products={productList}
          onCheckout={() => navigate({ to: '/checkout' })}
        />
      </div>
    </main>
  );
}
