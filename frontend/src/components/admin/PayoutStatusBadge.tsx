import React from 'react';
import type { PayoutStatus } from '../../types';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  processing: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-600 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

interface PayoutStatusBadgeProps {
  status: PayoutStatus | string;
}

export default function PayoutStatusBadge({ status }: PayoutStatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  const label = statusLabels[status] ?? status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}
