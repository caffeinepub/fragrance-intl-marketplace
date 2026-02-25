import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '../../backend';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  [OrderStatus.pending]: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  },
  [OrderStatus.processing]: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  },
  [OrderStatus.shipped]: {
    label: 'Shipped',
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  },
  [OrderStatus.delivered]: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  },
  [OrderStatus.canceled]: {
    label: 'Canceled',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: String(status),
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge
      variant="outline"
      className={`font-sans text-xs font-medium px-2.5 py-0.5 ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
