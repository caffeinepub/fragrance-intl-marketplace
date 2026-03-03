import React from "react";
import type { BidEntry } from "../../types";

interface BidHistoryListProps {
  bids: BidEntry[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function BidHistoryList({ bids }: BidHistoryListProps) {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No bids placed yet.
      </div>
    );
  }

  const sorted = [...bids].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-2">
      {sorted.map((bid) => (
        <div
          key={`${String(bid.bidder)}-${bid.timestamp}`}
          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
        >
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {String(bid.bidder).slice(0, 14)}…
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(bid.timestamp)}
            </p>
          </div>
          <span className="font-semibold text-primary">
            {formatPrice(bid.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
