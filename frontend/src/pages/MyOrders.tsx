import React from 'react';
import { useGetMyOrders } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { ClipboardList, ShoppingBag, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../backend';

export default function MyOrders() {
  const { identity } = useInternetIdentity();
  const { data: orders, isLoading } = useGetMyOrders();

  if (!identity) {
    return <AccessDenied message="Please sign in to view your orders." />;
  }

  const formatPrice = (cents: bigint) => `$${(Number(cents) / 100).toFixed(2)}`;
  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Account</p>
        <h1 className="font-serif text-3xl text-foreground">My Orders</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded" />)}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-14 h-14 text-muted-foreground opacity-20 mb-5" />
          <h2 className="font-serif text-2xl text-foreground mb-3">No orders yet</h2>
          <p className="text-muted-foreground font-sans mb-6">
            Start shopping to see your orders here.
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {[...orders].reverse().map((order) => {
            const isCanceled = order.status === OrderStatus.canceled;
            return (
              <div
                key={order.id}
                className={`bg-card border border-border rounded p-5 hover:border-gold/30 transition-colors ${
                  isCanceled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <p className={`font-mono text-xs text-muted-foreground ${isCanceled ? 'line-through' : ''}`}>
                      {order.id}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      {formatDate(order.timestamp)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className={`font-serif text-lg ${isCanceled ? 'text-muted-foreground line-through' : 'text-gold'}`}>
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.productId} className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img
                          src="/assets/generated/product-placeholder.dim_600x600.png"
                          alt={item.productId}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <span className="font-sans text-xs text-muted-foreground">+{order.items.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Link to="/order/$orderId" params={{ orderId: order.id }}>
                      View Details
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
