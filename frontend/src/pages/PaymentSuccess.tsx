import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useConfirmStripePayment, useGetOrder } from '../hooks/useQueries';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { CheckCircle, Loader2 } from 'lucide-react';

function getSessionIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('session_id');
}

function getOrderIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('order_id');
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const confirmPayment = useConfirmStripePayment();
  const [sessionId] = useState(() => getSessionIdFromUrl());
  const [orderId] = useState(() => getOrderIdFromUrl());

  const { data: order, isLoading: orderLoading } = useGetOrder(orderId);

  useEffect(() => {
    if (sessionId) {
      confirmPayment.mutate({ sessionId, orderId: orderId ?? '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (confirmPayment.isSuccess && orderId) {
      const timer = setTimeout(() => {
        navigate({ to: '/order/$orderId', params: { orderId } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmPayment.isSuccess, orderId, navigate]);

  if (confirmPayment.isPending) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-lg text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-gold animate-spin" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Confirming Payment…</h1>
        <p className="font-sans text-sm text-muted-foreground">Please wait while we confirm your payment.</p>
      </main>
    );
  }

  if (confirmPayment.isError) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">✕</span>
        </div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Payment Confirmation Failed</h1>
        <p className="font-sans text-sm text-muted-foreground mb-6">
          {confirmPayment.error?.message || 'There was an issue confirming your payment.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline" className="font-sans border-border">
            <Link to="/my-orders">My Orders</Link>
          </Button>
          <Button asChild className="font-sans bg-gold text-background hover:bg-gold/90">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Success</p>
        <h1 className="font-serif text-3xl text-foreground mb-2">Payment Received!</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Your order has been confirmed. Redirecting to order details…
        </p>
      </div>

      {orderLoading ? (
        <Skeleton className="h-48 w-full rounded" />
      ) : order ? (
        <div className="bg-card border border-border rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} />
            <span className="font-sans text-xs text-muted-foreground">
              Placed on {formatDate(order.timestamp)}
            </span>
          </div>
          <div>
            <p className="font-sans text-xs text-muted-foreground mb-1">Order ID</p>
            <p className="font-mono text-sm text-foreground">{order.id}</p>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-sans text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-xl text-gold">{formatPrice(order.total)}</span>
          </div>
        </div>
      ) : orderId ? (
        <div className="bg-card border border-border rounded p-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Order reference: <span className="font-mono">{orderId}</span>
          </p>
        </div>
      ) : null}

      <div className="flex gap-3 justify-center mt-6">
        {orderId && (
          <Button
            className="font-sans bg-gold text-background hover:bg-gold/90"
            onClick={() => navigate({ to: '/order/$orderId', params: { orderId } })}
          >
            View Order
          </Button>
        )}
        <Button asChild variant="outline" className="font-sans border-border">
          <Link to="/my-orders">All Orders</Link>
        </Button>
      </div>
    </main>
  );
}
