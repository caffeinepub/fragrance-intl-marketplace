import React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetStripeSessionStatus } from '../hooks/useQueries';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { session_id?: string };
  const sessionId = search?.session_id ?? undefined;

  const { data: sessionStatus, isLoading } = useGetStripeSessionStatus(sessionId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-2">
        Your payment has been processed successfully. Thank you for your purchase!
      </p>
      {sessionId && (
        <p className="font-mono text-xs text-muted-foreground mb-8">
          Session: {sessionId.slice(0, 20)}…
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => navigate({ to: '/my-orders' })}>
          <Package className="mr-2 h-4 w-4" />
          View My Orders
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: '/products' })}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
