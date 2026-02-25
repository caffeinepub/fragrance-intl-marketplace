import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetAuction } from '../hooks/useQueries';
import AuctionCountdown from '../components/auctions/AuctionCountdown';
import AuctionStatusBadge from '../components/auctions/AuctionStatusBadge';
import BidForm from '../components/auctions/BidForm';
import BidHistoryList from '../components/auctions/BidHistoryList';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, TrendingUp, Gavel, Trophy } from 'lucide-react';

export default function AuctionDetail() {
  const { auctionId } = useParams({ from: '/auctions/$auctionId' });
  const { data: auction, isLoading, refetch } = useGetAuction(auctionId);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-5xl text-center">
        <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h2 className="font-serif text-2xl text-foreground mb-2">Auction Not Found</h2>
        <p className="font-sans text-sm text-muted-foreground mb-6">
          This auction may have been removed or doesn't exist.
        </p>
        <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
          <Link to="/auctions">Back to Auctions</Link>
        </Button>
      </main>
    );
  }

  const isEnded = auction.status !== 'active' || Date.now() >= auction.endTime;

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
        <Link to="/auctions">
          <ArrowLeft className="w-4 h-4 mr-1" />
          All Auctions
        </Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Image */}
        <div className="relative rounded overflow-hidden border border-border aspect-square">
          <img
            src={auction.productImage || '/assets/generated/product-placeholder.dim_600x600.png'}
            alt={auction.productName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <AuctionStatusBadge status={isEnded ? 'ended' : auction.status} />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-serif text-2xl text-foreground mb-2">{auction.productName}</h1>
            <p className="font-sans text-xs text-muted-foreground">
              Auction ID: <span className="font-mono">{auction.id}</span>
            </p>
          </div>

          {/* Bid Info */}
          <div className="bg-card border border-border rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-muted-foreground">Current Bid</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="font-serif text-2xl font-bold text-gold">
                  ${auction.currentBid.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-muted-foreground">Starting Price</span>
              <span className="font-sans text-sm text-foreground">${auction.startingPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-muted-foreground">Total Bids</span>
              <div className="flex items-center gap-1">
                <Gavel className="w-4 h-4 text-muted-foreground" />
                <span className="font-sans text-sm text-foreground">{auction.bidHistory.length}</span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-card border border-border rounded p-4">
            <p className="font-sans text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              {isEnded ? 'Auction Status' : 'Time Remaining'}
            </p>
            {isEnded ? (
              <div className="space-y-2">
                <p className="font-sans text-sm font-medium text-muted-foreground">This auction has ended.</p>
                {auction.highestBidderId && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Trophy className="w-4 h-4" />
                    <span className="font-sans text-sm">
                      Winner: <span className="font-mono">{auction.highestBidderId.slice(0, 12)}…</span>
                    </span>
                  </div>
                )}
                {!auction.highestBidderId && (
                  <p className="font-sans text-sm text-muted-foreground">No bids were placed.</p>
                )}
              </div>
            ) : (
              <AuctionCountdown endTime={auction.endTime} />
            )}
          </div>

          {/* Bid Form */}
          <div className="bg-card border border-border rounded p-4">
            <p className="font-sans text-xs text-muted-foreground mb-3 uppercase tracking-wider">Place a Bid</p>
            <BidForm auction={auction} onBidPlaced={() => refetch()} />
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Bid History */}
      <div>
        <h2 className="font-serif text-xl text-foreground mb-4">Bid History</h2>
        <BidHistoryList bids={auction.bidHistory} />
      </div>
    </main>
  );
}
