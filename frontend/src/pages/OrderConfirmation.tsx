import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetOrder } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ClipboardList, ShoppingBag } from 'lucide-react';

export default function OrderConfirmation() {
  const { identity } = useInternetIdentity();
  const { orderId } = useParams({ from: '/order/$orderId' });
  const { data: order, isLoading, isError } = useGetOrder(orderId || null);

  if (!identity) {
    return <AccessDenied message="Please sign in to view your order." />;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl text-center">
        <p className="text-muted-foreground font-sans">Order not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/my-orders">View All Orders</Link>
        </Button>
      </main>
    );
  }

  const formatPrice = (cents: bigint) => `$${(Number(cents) / 100).toFixed(2)}`;
  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      {/* Success Banner */}
      <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-serif text-3xl text-foreground mb-2">Order Confirmed!</h1>
        <p className="font-sans text-muted-foreground">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {/* Status Timeline */}
      <div className="bg-card border border-border rounded p-5 mb-5">
        <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-4">Order Progress</p>
        <OrderStatusTimeline currentStatus={order.status} />
      </div>

      {/* Order Details Card */}
      <div className="bg-card border border-border rounded p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
            <p className="font-mono text-sm text-foreground">{order.id}</p>
          </div>
          <OrderStatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>

        <div className="flex items-center gap-4 text-sm font-sans text-muted-foreground">
          <span>Placed on {formatDate(order.timestamp)}</span>
          <span>·</span>
          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-serif text-base text-foreground">Items Ordered</h3>
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                <img
                  src="/assets/generated/product-placeholder.dim_600x600.png"
                  alt={item.productId}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">{item.productId}</p>
                <p className="text-xs text-muted-foreground">Qty: {Number(item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-serif text-base text-foreground">Order Total</span>
          <span className="font-serif text-xl text-gold">{formatPrice(order.total)}</span>
        </div>

        {/* Shipping */}
        {order.shippingAddress && order.shippingAddress !== 'Digital/Service — No shipping required' && (
          <>
            <Separator />
            <div>
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Shipping Address
              </p>
              <p className="font-sans text-sm text-foreground">{order.shippingAddress}</p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/my-orders">
            <ClipboardList className="w-4 h-4 mr-2" />
            View All Orders
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 border-gold/30 text-bronze hover:bg-gold/5">
          <Link to="/products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </main>
  );
}
