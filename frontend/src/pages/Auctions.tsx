import React from 'react';
import { useListActiveAuctions } from '../hooks/useQueries';
import type { LocalAuction } from '../hooks/useQueries';
import AuctionGrid from '../components/auctions/AuctionGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel } from 'lucide-react';

export default function Auctions() {
  const { data: auctions, isLoading } = useListActiveAuctions();

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Live</p>
        <div className="flex items-center gap-3">
          <Gavel className="w-7 h-7 text-gold" />
          <h1 className="font-serif text-3xl text-foreground">Auctions</h1>
        </div>
        <p className="font-sans text-sm text-muted-foreground mt-2">
          Bid on exclusive fragrances and rare finds. Live countdown timers on every auction.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <AuctionGrid auctions={(auctions ?? []) as LocalAuction[]} />
      )}
    </main>
  );
}
