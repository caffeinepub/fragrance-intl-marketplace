import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrder } from '../hooks/useQueries';

export default function OrderConfirmation() {
  const { orderId } = useParams({ from: '/order-confirmation/$orderId' });
  const navigate = useNavigate();
  const { data: order } = useGetOrder(orderId ?? null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-muted-foreground mb-2">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      {orderId && (
        <p className="font-mono text-sm text-muted-foreground mb-8">
          Order ID: {orderId}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => navigate({ to: '/my-orders' })}>
          <Package className="mr-2 h-4 w-4" />
          View My Orders
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: '/products' })}>
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
