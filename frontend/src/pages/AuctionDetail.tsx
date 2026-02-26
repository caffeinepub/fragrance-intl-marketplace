import React from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetAuction } from '../hooks/useQueries';
import BidForm from '../components/auctions/BidForm';
import BidHistoryList from '../components/auctions/BidHistoryList';
import AuctionStatusBadge from '../components/auctions/AuctionStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Gavel, User } from 'lucide-react';

function useCountdown(endTime: number) {
  const [timeLeft, setTimeLeft] = React.useState('');
  React.useEffect(() => {
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return timeLeft;
}

export default function AuctionDetail() {
  const { auctionId } = useParams({ from: '/auctions/$auctionId' });
  const { data: auction, isLoading, refetch } = useGetAuction(auctionId);
  const countdown = useCountdown(auction?.endTime ?? 0);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-3xl text-center">
        <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="font-serif text-2xl text-foreground mb-2">Auction Not Found</h1>
        <p className="font-sans text-sm text-muted-foreground">This auction does not exist or has been removed.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-6">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Auction</p>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="font-serif text-2xl text-foreground">{auction.title}</h1>
          <AuctionStatusBadge status={auction.status} />
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-1">ID: {auction.auctionId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left: Details */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded p-5 space-y-3">
            {auction.description && (
              <p className="font-sans text-sm text-muted-foreground">{auction.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">Starting Price</span>
                <span className="text-foreground">${(auction.startingPrice / 100).toFixed(2)}</span>
              </div>
              {auction.currentBid != null && (
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Current Bid</span>
                  <span className="text-gold font-medium text-lg">
                    ${(auction.currentBid / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {auction.reservePrice != null && (
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Reserve Price</span>
                  <span className="text-foreground">${(auction.reservePrice / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm font-sans text-muted-foreground pt-1 border-t border-border">
              <Clock className="w-4 h-4" />
              <span>{auction.status === 'active' ? countdown : 'Auction ended'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-sans text-muted-foreground">
              <Gavel className="w-4 h-4" />
              <span>{auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}</span>
            </div>

            {auction.status === 'ended' && auction.currentBidder && (
              <div className="flex items-center gap-1.5 text-sm font-sans text-emerald-600 bg-emerald-500/10 rounded p-2">
                <User className="w-4 h-4" />
                <span>Winner: <span className="font-mono">{auction.currentBidder.slice(0, 12)}…</span></span>
              </div>
            )}
            {auction.status === 'ended' && !auction.currentBidder && (
              <p className="font-sans text-sm text-muted-foreground italic">No winner — reserve not met or no bids.</p>
            )}
          </div>

          {/* Bid Form */}
          <div className="bg-card border border-border rounded p-5">
            <h2 className="font-serif text-lg text-foreground mb-4">Place a Bid</h2>
            <BidForm auction={auction} />
          </div>
        </div>

        {/* Right: Bid History */}
        <div className="bg-card border border-border rounded p-5">
          <h2 className="font-serif text-lg text-foreground mb-4">Bid History</h2>
          <BidHistoryList bids={auction.bids} />
        </div>
      </div>
    </main>
  );
}
