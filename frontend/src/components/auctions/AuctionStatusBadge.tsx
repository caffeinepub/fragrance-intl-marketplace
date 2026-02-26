import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { AuctionStatus } from '../../types';

interface AuctionStatusBadgeProps {
  status: AuctionStatus | string;
}

export default function AuctionStatusBadge({ status }: AuctionStatusBadgeProps) {
  const variants: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    ended: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    canceled: 'bg-red-500/15 text-red-600 border-red-500/30',
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
