import React from 'react';
import { useGetMyOrders } from '../hooks/useQueries';
import { OrderStatus } from '../types';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from '@tanstack/react-router';
import { ShoppingBag, Receipt } from 'lucide-react';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function MyOrders() {
  const { data: orders, isLoading } = useGetMyOrders();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </main>
    );
  }

  const sorted = [...(orders ?? [])].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Account</p>
        <h1 className="font-serif text-3xl text-foreground">My Orders</h1>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="font-serif text-xl text-foreground mb-2">No Orders Yet</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            You haven't placed any orders. Start shopping!
          </p>
          <Button asChild className="font-sans bg-gold text-background hover:bg-gold/90">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded p-4 flex items-center gap-4 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-muted-foreground mb-1">{order.id.slice(0, 14)}…</p>
                <p className="font-sans text-xs text-muted-foreground">
                  {formatDate(order.timestamp)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-sans text-sm font-medium text-gold">
                  {formatPrice(order.total)}
                </span>
                <OrderStatusBadge status={order.status} />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-sans border-border"
                  onClick={() =>
                    navigate({ to: '/order/$orderId', params: { orderId: order.id } })
                  }
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs font-sans text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    navigate({ to: '/order/$orderId/receipt', params: { orderId: order.id } })
                  }
                >
                  <Receipt className="w-3 h-3 mr-1" />
                  Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
