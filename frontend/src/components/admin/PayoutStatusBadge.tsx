import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PayoutStatus } from '../../backend';

interface PayoutStatusBadgeProps {
  status: PayoutStatus;
  className?: string;
}

const statusConfig: Record<PayoutStatus, { label: string; className: string }> = {
  [PayoutStatus.pending]: {
    label: 'Pending',
    className:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  },
  [PayoutStatus.processing]: {
    label: 'Processing',
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  },
  [PayoutStatus.completed]: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  },
  [PayoutStatus.failed]: {
    label: 'Failed',
    className:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  },
};

export default function PayoutStatusBadge({ status, className = '' }: PayoutStatusBadgeProps) {
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
