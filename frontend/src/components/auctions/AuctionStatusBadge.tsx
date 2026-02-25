import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { AuctionStatus } from '../../hooks/useQueries';

interface AuctionStatusBadgeProps {
  status: AuctionStatus;
}

export default function AuctionStatusBadge({ status }: AuctionStatusBadgeProps) {
  const config: Record<AuctionStatus, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    ended: {
      label: 'Ended',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    },
  };

  const { label, className } = config[status] ?? config.ended;

  return (
    <Badge variant="outline" className={`font-sans text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
