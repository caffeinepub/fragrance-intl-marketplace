import React, { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetOrder } from '../hooks/useQueries';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { CheckCircle, Package } from 'lucide-react';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderConfirmation() {
  const { orderId } = useParams({ from: '/order/$orderId' });
  const { data: order, isLoading } = useGetOrder(orderId);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Order Not Found</h1>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          We couldn't find this order. It may have been removed.
        </p>
        <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
          <Link to="/my-orders">My Orders</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Confirmed</p>
        <h1 className="font-serif text-3xl text-foreground mb-2">Order Placed!</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Thank you for your order. We'll notify you when it ships.
        </p>
      </div>

      <div className="bg-card border border-border rounded p-6 space-y-5">
        {/* Timeline */}
        <div className="overflow-x-auto pb-2">
          <OrderStatusTimeline status={order.status} />
        </div>

        {/* Status & Date */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="font-sans text-xs text-muted-foreground">
            Placed on {formatDate(order.timestamp)}
          </span>
        </div>

        {/* Order ID */}
        <div>
          <p className="font-sans text-xs text-muted-foreground mb-1">Order ID</p>
          <p className="font-mono text-sm text-foreground">{order.id}</p>
        </div>

        {/* Items */}
        <div>
          <p className="font-sans text-xs text-muted-foreground mb-2">Items ({order.items.length})</p>
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground font-mono text-xs">{item.productId.slice(0, 12)}…</span>
                <span className="text-foreground">× {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="font-sans text-sm text-muted-foreground">Total</span>
          <span className="font-serif text-xl text-gold">{formatPrice(order.total)}</span>
        </div>

        <div className="flex gap-3 flex-wrap pt-2">
          <Button asChild className="font-sans bg-gold text-background hover:bg-gold/90">
            <Link to="/my-orders">View All Orders</Link>
          </Button>
          <Button asChild variant="outline" className="font-sans border-border">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
