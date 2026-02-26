import React from 'react';
import { useListActiveAuctions } from '../hooks/useQueries';
import AuctionGrid from '../components/auctions/AuctionGrid';
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

      <AuctionGrid
        auctions={auctions ?? []}
        isLoading={isLoading}
      />
    </main>
  );
}
