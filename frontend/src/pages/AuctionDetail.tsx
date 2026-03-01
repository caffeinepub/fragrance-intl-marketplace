import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetAuction } from '../hooks/useQueries';
import type { LocalAuction } from '../hooks/useQueries';
import BidForm from '../components/auctions/BidForm';

function AuctionStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    ended: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    canceled: 'bg-red-500/15 text-red-600 border-red-500/30',
  };
  return (
    <Badge variant="outline" className={`text-xs ${variants[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  );
}

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

function BidHistoryList({ bids }: { bids: LocalAuction['bids'] }) {
  if (bids.length === 0) {
    return <p className="font-sans text-sm text-muted-foreground text-center py-4">No bids yet.</p>;
  }
  return (
    <div className="space-y-2">
      {[...bids].reverse().map((bid, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
          <span className="font-mono text-xs text-muted-foreground">{String(bid.bidder).slice(0, 12)}…</span>
          <span className="font-sans text-sm text-gold font-medium">${(bid.amount / 100).toFixed(2)}</span>
          <span className="font-sans text-xs text-muted-foreground">{new Date(bid.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuctionDetail() {
  const { auctionId } = useParams({ from: '/auctions/$auctionId' });
  const navigate = useNavigate();
  const { data: auction, isLoading } = useGetAuction(auctionId ?? undefined);

  const typedAuction = auction as LocalAuction | null | undefined;
  const countdown = useCountdown(typedAuction?.endTime ?? 0);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
      </div>
    );
  }

  if (!typedAuction) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-2">Auction Not Found</h2>
        <p className="text-muted-foreground mb-6">This auction may have ended or been removed.</p>
        <Button variant="outline" onClick={() => navigate({ to: '/auctions' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Auctions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate({ to: '/auctions' })}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Auctions
      </button>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground">{typedAuction.title}</h1>
            <AuctionStatusBadge status={typedAuction.status} />
            <p className="font-mono text-xs text-muted-foreground mt-1">ID: {typedAuction.id}</p>
          </div>
        </div>

        {typedAuction.description && (
          <p className="font-sans text-sm text-muted-foreground">{typedAuction.description}</p>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm font-sans">
          <div>
            <span className="text-muted-foreground">Starting Price</span>
            <p className="text-foreground font-medium">${(typedAuction.startingPrice / 100).toFixed(2)}</p>
          </div>
          {typedAuction.currentBid != null && (
            <div>
              <span className="text-muted-foreground">Current Bid</span>
              <p className="text-gold font-medium text-lg">${(typedAuction.currentBid / 100).toFixed(2)}</p>
            </div>
          )}
          {typedAuction.reservePrice != null && (
            <div>
              <span className="text-muted-foreground">Reserve Price</span>
              <p className="text-foreground font-medium">${(typedAuction.reservePrice / 100).toFixed(2)}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Time Left</span>
            <p className="text-foreground font-medium">{typedAuction.status === 'active' ? countdown : 'Auction ended'}</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Bids</span>
            <p className="text-foreground font-medium">{typedAuction.bids.length} bid{typedAuction.bids.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {typedAuction.status === 'ended' && typedAuction.currentBidder && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
            <span className="font-sans text-sm text-emerald-600">Winner: <span className="font-mono">{String(typedAuction.currentBidder).slice(0, 12)}…</span></span>
          </div>
        )}
        {typedAuction.status === 'ended' && !typedAuction.currentBidder && (
          <div className="bg-muted rounded p-3">
            <span className="font-sans text-sm text-muted-foreground">No winner — reserve price not met or no bids placed.</span>
          </div>
        )}

        {typedAuction.status === 'active' && (
          <>
            <Separator />
            <div>
              <h3 className="font-serif text-base text-foreground mb-3">Place a Bid</h3>
              <BidForm auction={typedAuction} />
            </div>
          </>
        )}

        <Separator />
        <div>
          <h3 className="font-serif text-base text-foreground mb-3">Bid History</h3>
          <BidHistoryList bids={typedAuction.bids} />
        </div>
      </div>
    </div>
  );
}
