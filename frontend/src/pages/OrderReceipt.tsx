import React from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetOrder, useOrderTransaction, useIsCallerAdmin, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { OrderStatus } from '../backend';

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatPriceNum(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function shortOrderId(id: string): string {
  // Convert order_<timestamp> to a human-readable invoice number
  const parts = id.split('_');
  const num = parts[parts.length - 1];
  return `INV-${num.slice(-8).toUpperCase()}`;
}

export default function OrderReceipt() {
  const { orderId } = useParams({ from: '/order/$orderId/receipt' });
  const { identity } = useInternetIdentity();

  const { data: order, isLoading: orderLoading } = useGetOrder(orderId ?? null);
  const { data: transaction, isLoading: txLoading } = useOrderTransaction(orderId ?? null);
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();

  if (!identity) {
    return <AccessDenied message="Please sign in to view this receipt." />;
  }

  const isLoading = orderLoading || txLoading;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full rounded" />
      </main>
    );
  }

  if (!order) {
    return <AccessDenied message="Order not found or you do not have permission to view it." />;
  }

  // Access control: only the customer, vendor (via transaction), or admin can view
  const callerPrincipal = identity.getPrincipal().toString();
  const isCustomer = order.customer.toString() === callerPrincipal;
  const isVendor = transaction
    ? transaction.vendor.toString() === callerPrincipal
    : false;

  if (!isCustomer && !isVendor && !isAdmin) {
    return (
      <AccessDenied message="You do not have permission to view this receipt." />
    );
  }

  // Show commission line only to vendor or admin
  const showCommission = isVendor || isAdmin;

  const subtotal = Number(order.total);
  const commissionAmount = transaction ? Number(transaction.commissionFee) : 0;
  const netPayout = transaction ? Number(transaction.netPayout) : subtotal;

  const isDelivered = order.status === OrderStatus.delivered;

  return (
    <>
      {/* Screen-only navigation */}
      <div className="print:hidden container mx-auto px-4 pt-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/my-orders">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Orders
            </Link>
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="border-gold/40 text-bronze hover:bg-gold/5"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Invoice document */}
      <main className="container mx-auto px-4 pb-16 max-w-2xl print:max-w-full print:px-8 print:pb-8">
        <div className="bg-card border border-border rounded luxury-shadow print:shadow-none print:border-none print:rounded-none">

          {/* Header */}
          <div className="p-8 border-b border-border print:border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/assets/generated/logo-mark.dim_256x256.png"
                    alt="Fragrance.Intl"
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <h1 className="font-serif text-xl text-foreground leading-tight">Fragrance.Intl</h1>
                    <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase">
                      Luxury Fragrances
                    </p>
                  </div>
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-1">
                  fragrance.intl · Premium Scent Marketplace
                </p>
              </div>

              <div className="text-right">
                <p className="font-sans text-xs text-gold uppercase tracking-[0.15em] mb-1">Invoice</p>
                <p className="font-mono text-lg font-medium text-foreground">{shortOrderId(order.id)}</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">
                  Issued {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Bill To / Order Info */}
          <div className="p-8 border-b border-border grid grid-cols-2 gap-8">
            <div>
              <p className="font-sans text-xs text-gold uppercase tracking-[0.15em] mb-2">Bill To</p>
              <p className="font-serif text-base text-foreground">
                {userProfile?.name ?? 'Customer'}
              </p>
              {userProfile?.email && (
                <p className="font-sans text-sm text-muted-foreground">{userProfile.email}</p>
              )}
              <p className="font-sans text-xs text-muted-foreground mt-2 break-all">
                {callerPrincipal.slice(0, 20)}…
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-gold uppercase tracking-[0.15em] mb-2">Ship To</p>
              <p className="font-sans text-sm text-foreground whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>
          </div>

          {/* Order Status */}
          <div className="px-8 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              <OrderStatusBadge status={order.status} />
            </div>
            {isDelivered && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-sans text-xs font-medium">Payment Confirmed</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="p-8 border-b border-border">
            <p className="font-sans text-xs text-gold uppercase tracking-[0.15em] mb-4">Items</p>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src="/assets/generated/product-placeholder.dim_600x600.png"
                        alt={item.productId}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm text-foreground truncate">
                        Product #{item.productId.slice(-8)}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        Qty: {Number(item.quantity)}
                      </p>
                    </div>
                  </div>
                  <p className="font-sans text-sm text-foreground flex-shrink-0">
                    ×{Number(item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-8">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPriceNum(subtotal)}</span>
              </div>

              <div className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">Included</span>
              </div>

              {/* Commission line — only visible to vendor or admin */}
              {showCommission && transaction && (
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-muted-foreground">Platform Commission</span>
                  <span className="text-destructive">−{formatPriceNum(commissionAmount)}</span>
                </div>
              )}

              <Separator className="my-3" />

              <div className="flex justify-between font-sans">
                <span className="text-sm font-medium text-foreground">
                  {showCommission ? 'Net Payout' : 'Total'}
                </span>
                <span className="text-lg font-semibold text-gold">
                  {showCommission
                    ? formatPriceNum(netPayout)
                    : formatPrice(order.total)}
                </span>
              </div>

              {/* Payment method */}
              <div className="flex justify-between font-sans text-xs text-muted-foreground pt-1">
                <span>Payment Method</span>
                <span>Stripe</span>
              </div>
            </div>
          </div>

          {/* Footer stamp */}
          <div className="px-8 pb-8">
            <Separator className="mb-6" />
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs text-muted-foreground">
                Thank you for your purchase at Fragrance.Intl
              </p>
              {isDelivered && (
                <div className="border-2 border-green-500/40 rounded px-3 py-1 rotate-[-2deg]">
                  <p className="font-serif text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">
                    Paid
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block mt-8 text-center">
          <p className="font-sans text-xs text-muted-foreground">
            Fragrance.Intl · Premium Scent Marketplace · {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </>
  );
}
