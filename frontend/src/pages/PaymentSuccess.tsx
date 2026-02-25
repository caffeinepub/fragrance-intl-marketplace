import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useConfirmStripePayment, useGetOrder } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ClipboardList, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { OrderStatus } from '../backend';
import { getSessionIdFromUrl } from '../utils/urlParams';

export default function PaymentSuccess() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const hasConfirmed = useRef(false);

  // Read query params from the URL
  const search = useSearch({ strict: false }) as Record<string, string>;
  const orderId = search['orderId'] ?? '';
  // session_id may come from Stripe redirect or URL params
  const sessionId = search['session_id'] ?? getSessionIdFromUrl() ?? '';

  const confirmPayment = useConfirmStripePayment();
  const { data: order, isLoading: orderLoading } = useGetOrder(orderId || null);

  useEffect(() => {
    if (!sessionId || hasConfirmed.current) return;
    hasConfirmed.current = true;
    confirmPayment.mutate({ sessionId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-navigate to order page after confirmation
  useEffect(() => {
    if (!confirmPayment.isSuccess) return;
    const targetOrderId = confirmPayment.data?.orderId || orderId;
    if (!targetOrderId) return;
    const timer = setTimeout(() => {
      navigate({ to: '/order/$orderId', params: { orderId: targetOrderId } });
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmPayment.isSuccess, confirmPayment.data, orderId, navigate]);

  const isConfirming = confirmPayment.isPending;
  const isLoading = isConfirming || orderLoading;

  const formatPrice = (cents: bigint) => `$${(Number(cents) / 100).toFixed(2)}`;
  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Missing session_id
  if (!sessionId) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Missing Payment Information</h1>
        <p className="font-sans text-muted-foreground mb-6">
          We could not find the required payment session details in the URL. Please contact support
          {orderId ? ` with your Order ID: ` : '.'}
          {orderId && <span className="font-mono text-foreground">{orderId}</span>}
        </p>
        <Button asChild variant="outline">
          <Link to="/my-orders">View My Orders</Link>
        </Button>
      </main>
    );
  }

  // Confirming payment loading state
  if (isConfirming) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Confirming your payment…</h1>
          <p className="font-sans text-muted-foreground">
            Please wait while we verify your payment with Stripe.
          </p>
        </div>
      </main>
    );
  }

  // Error confirming payment
  if (confirmPayment.isError) {
    const errMsg =
      confirmPayment.error instanceof Error
        ? confirmPayment.error.message
        : 'An unexpected error occurred.';
    return (
      <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Payment Confirmation Failed</h1>
        <p className="font-sans text-muted-foreground mb-2">
          We were unable to confirm your payment automatically.
        </p>
        {orderId && (
          <p className="font-sans text-sm text-muted-foreground mb-2">
            Order ID: <span className="font-mono text-foreground">{orderId}</span>
          </p>
        )}
        <p className="font-sans text-xs text-destructive mb-6">{errMsg}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/my-orders">View My Orders</Link>
          </Button>
          <Button asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Loading order details
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <Skeleton className="w-16 h-16 rounded-full mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-64 w-full rounded" />
      </main>
    );
  }

  // Success state
  const displayOrderId = confirmPayment.data?.orderId || orderId;

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      {/* Success Banner */}
      <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-serif text-3xl text-foreground mb-2">Payment Successful!</h1>
        <p className="font-sans text-muted-foreground">
          Thank you for your purchase. Your payment has been confirmed and your order is being processed.
        </p>
        {displayOrderId && (
          <p className="font-sans text-xs text-muted-foreground mt-2">
            Redirecting to your order in a moment…
          </p>
        )}
      </div>

      {/* Order Summary Card */}
      <div className="bg-card border border-border rounded p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
            <p className="font-mono text-sm text-foreground">{displayOrderId || '—'}</p>
          </div>
          <OrderStatusBadge status={OrderStatus.processing} />
        </div>

        {order && (
          <>
            <div className="flex items-center gap-4 text-sm font-sans text-muted-foreground">
              <span>Placed on {formatDate(order.timestamp)}</span>
              <span>·</span>
              <span>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
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
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          asChild
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
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
