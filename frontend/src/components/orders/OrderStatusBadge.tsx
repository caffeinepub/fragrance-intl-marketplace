import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variants: Record<string, string> = {
    [OrderStatus.pending]: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    [OrderStatus.processing]: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    [OrderStatus.shipped]: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    [OrderStatus.delivered]: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    [OrderStatus.canceled]: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs capitalize ${variants[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status}
    </Badge>
  );
}

export default OrderStatusBadge;
