import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AuctionCard from './AuctionCard';
import type { Auction } from '../../hooks/useQueries';
import { Gavel } from 'lucide-react';

interface AuctionGridProps {
  auctions: Auction[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function AuctionGrid({ auctions, isLoading, emptyMessage = 'No auctions found.' }: AuctionGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Gavel className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
        <p className="font-serif text-xl text-foreground mb-2">No Auctions</p>
        <p className="font-sans text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}
