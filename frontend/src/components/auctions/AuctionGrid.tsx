import React from 'react';
import type { Auction } from '../../types';
import AuctionCard from './AuctionCard';
import { Skeleton } from '@/components/ui/skeleton';

interface AuctionGridProps {
  auctions: Auction[];
  isLoading?: boolean;
}

export default function AuctionGrid({ auctions, isLoading }: AuctionGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded" />)}
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-sm text-muted-foreground">No auctions available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {auctions.map((auction) => (
        <AuctionCard key={auction.auctionId} auction={auction} />
      ))}
    </div>
  );
}
