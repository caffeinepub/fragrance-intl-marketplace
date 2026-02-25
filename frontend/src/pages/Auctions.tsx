import React from 'react';
import { Link } from '@tanstack/react-router';
import { useListActiveAuctions } from '../hooks/useQueries';
import AuctionGrid from '../components/auctions/AuctionGrid';
import { Gavel, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Auctions() {
  const { data: auctions, isLoading, refetch, isFetching } = useListActiveAuctions();

  return (
    <main className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Live</p>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
            <Gavel className="w-7 h-7 text-gold" />
            Auctions
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-2">
            Bid on exclusive fragrances. Timers update in real time.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-gold/30 text-bronze hover:bg-gold/5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Auction Grid */}
      <AuctionGrid
        auctions={auctions ?? []}
        isLoading={isLoading}
        emptyMessage="No active auctions at the moment. Check back soon or browse our shop."
      />

      {/* CTA */}
      {!isLoading && (auctions ?? []).length === 0 && (
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
