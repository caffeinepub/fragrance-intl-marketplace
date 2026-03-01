import React from 'react';
import type { TradeOfferStatus } from '../../types';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-600 border-red-500/30',
  canceled: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  countered: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
};

interface TradeOfferStatusBadgeProps {
  status: TradeOfferStatus | string;
}

export default function TradeOfferStatusBadge({ status }: TradeOfferStatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}
