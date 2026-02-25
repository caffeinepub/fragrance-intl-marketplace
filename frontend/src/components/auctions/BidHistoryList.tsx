import React from 'react';
import type { BidEntry } from '../../hooks/useQueries';
import { Gavel } from 'lucide-react';

interface BidHistoryListProps {
  bids: BidEntry[];
}

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-4)}`;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BidHistoryList({ bids }: BidHistoryListProps) {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Gavel className="w-8 h-8 text-muted-foreground opacity-30 mb-2" />
        <p className="font-sans text-sm text-muted-foreground">No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  const sorted = [...bids].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-2">
      {sorted.map((bid, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between p-3 rounded border ${idx === 0 ? 'border-gold/30 bg-gold/5' : 'border-border bg-card'}`}
        >
          <div className="flex items-center gap-2">
            {idx === 0 && <Gavel className="w-3.5 h-3.5 text-gold" />}
            <span className="font-mono text-xs text-muted-foreground">
              {truncatePrincipal(bid.bidder)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-serif text-sm font-semibold ${idx === 0 ? 'text-gold' : 'text-foreground'}`}>
              ${bid.amount.toFixed(2)}
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              {formatRelativeTime(bid.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
