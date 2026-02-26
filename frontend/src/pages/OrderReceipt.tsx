import React from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetOrder, useOrderTransaction, useIsCallerAdmin } from '../hooks/useQueries';
import { OrderStatus } from '../types';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderReceipt() {
  const { orderId } = useParams({ from: '/order/$orderId/receipt' });
  const { data: order, isLoading: orderLoading } = useGetOrder(orderId);
  const { data: transaction, isLoading: txLoading } = useOrderTransaction(orderId);
  const { data: isAdmin } = useIsCallerAdmin();

  const isLoading = orderLoading || txLoading;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl text-center">
        <h1 className="font-serif text-2xl text-foreground mb-2">Receipt Not Found</h1>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          We couldn't find this order receipt.
        </p>
        <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
          <Link to="/my-orders">My Orders</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button asChild variant="ghost" className="font-sans text-sm text-muted-foreground hover:text-foreground">
          <Link to="/my-orders">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Orders
          </Link>
        </Button>
        <Button
          variant="outline"
          className="font-sans border-border"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="bg-card border border-border rounded p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/assets/generated/logo-mark.dim_256x256.png" alt="Fragrance.Intl" className="w-8 h-8 rounded" />
              <span className="font-serif text-lg text-foreground">Fragrance.Intl</span>
            </div>
            <p className="font-sans text-xs text-muted-foreground">
              Issued {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs text-muted-foreground mb-1">Invoice</p>
            <p className="font-mono text-sm text-foreground">{order.id.slice(0, 14)}…</p>
            <div className="mt-1">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        </div>

        {/* Shipping */}
        {order.shippingAddress && (
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-1">Ship To</p>
            <p className="font-sans text-sm text-foreground whitespace-pre-line">{order.shippingAddress}</p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground font-mono text-xs">{item.productId.slice(0, 16)}…</span>
                <span className="text-foreground">× {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-4 space-y-2">
          {transaction && isAdmin && (
            <>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="text-foreground">{formatPrice(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-muted-foreground">Commission</span>
                <span className="text-muted-foreground">-{formatPrice(transaction.commissionFee)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-sans text-base font-medium">
            <span className="text-foreground">
              {transaction && isAdmin ? 'Net Payout' : 'Total'}
            </span>
            <span className="text-gold font-serif text-xl">
              {transaction && isAdmin
                ? formatPrice(transaction.netPayout)
                : formatPrice(order.total)}
            </span>
          </div>
        </div>

        <p className="font-sans text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Thank you for shopping with Fragrance.Intl
        </p>
      </div>
    </main>
  );
}
