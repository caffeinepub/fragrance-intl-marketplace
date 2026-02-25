import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TradeOfferStatus } from '../../hooks/useQueries';

interface TradeOfferStatusBadgeProps {
  status: TradeOfferStatus;
}

export default function TradeOfferStatusBadge({ status }: TradeOfferStatusBadgeProps) {
  const config: Record<TradeOfferStatus, { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    accepted: {
      label: 'Accepted',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    },
    completed: {
      label: 'Completed',
      className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    },
  };

  const { label, className } = config[status] ?? config.pending;

  return (
    <Badge variant="outline" className={`font-sans text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
