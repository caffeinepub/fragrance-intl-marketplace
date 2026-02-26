import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PayoutStatus } from '../../types';

interface PayoutStatusBadgeProps {
  status: PayoutStatus | string;
}

export function PayoutStatusBadge({ status }: PayoutStatusBadgeProps) {
  const variants: Record<string, string> = {
    [PayoutStatus.pending]: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    [PayoutStatus.processing]: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    [PayoutStatus.completed]: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    [PayoutStatus.failed]: 'bg-red-500/15 text-red-600 border-red-500/30',
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

export default PayoutStatusBadge;
