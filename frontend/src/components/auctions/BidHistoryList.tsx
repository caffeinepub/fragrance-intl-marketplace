import React from 'react';
import type { BidEntry } from '../../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BidHistoryListProps {
  bids: BidEntry[];
}

export default function BidHistoryList({ bids }: BidHistoryListProps) {
  if (bids.length === 0) {
    return (
      <p className="font-sans text-sm text-muted-foreground text-center py-4">
        No bids yet. Be the first to bid!
      </p>
    );
  }

  const sorted = [...bids].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <ScrollArea className="h-48">
      <div className="space-y-2 pr-3">
        {sorted.map((bid, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <span className="font-mono text-xs text-muted-foreground">
              {bid.bidder.slice(0, 10)}…
            </span>
            <span className="font-sans text-sm font-medium text-gold">
              ${(bid.amount / 100).toFixed(2)}
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              {new Date(bid.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
