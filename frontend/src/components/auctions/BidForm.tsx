import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gavel, LogIn, AlertCircle } from 'lucide-react';
import { usePlaceBid, type Auction } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface BidFormProps {
  auction: Auction;
  onBidPlaced?: () => void;
}

export default function BidForm({ auction, onBidPlaced }: BidFormProps) {
  const { identity } = useInternetIdentity();
  const placeBid = usePlaceBid();
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const isEnded = auction.status !== 'active' || Date.now() >= auction.endTime;
  const isAuthenticated = !!identity;
  const minBid = auction.currentBid + 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }
    if (amount <= auction.currentBid) {
      setError(`Your bid must be higher than the current bid of $${auction.currentBid.toFixed(2)}.`);
      return;
    }
    try {
      await placeBid.mutateAsync({
        auctionId: auction.id,
        bidAmount: amount,
        bidderPrincipal: identity!.getPrincipal().toString(),
      });
      toast.success(`Bid of $${amount.toFixed(2)} placed successfully!`);
      setBidAmount('');
      onBidPlaced?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place bid.';
      setError(msg);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded border border-border text-center">
        <LogIn className="w-8 h-8 text-muted-foreground" />
        <p className="font-sans text-sm text-muted-foreground">
          Please sign in to place a bid on this auction.
        </p>
      </div>
    );
  }

  if (isEnded) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 bg-muted/30 rounded border border-border text-center">
        <p className="font-sans text-sm font-medium text-muted-foreground">Auction Ended</p>
        {auction.highestBidderId && (
          <p className="font-sans text-xs text-muted-foreground">
            Winner: <span className="font-mono">{auction.highestBidderId.slice(0, 12)}…</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bid-amount" className="font-sans text-sm">
          Your Bid (min ${minBid.toFixed(2)})
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-sans text-sm">$</span>
            <Input
              id="bid-amount"
              type="number"
              step="0.01"
              min={minBid}
              value={bidAmount}
              onChange={(e) => {
                setBidAmount(e.target.value);
                setError('');
              }}
              placeholder={minBid.toFixed(2)}
              className="pl-7 font-mono"
              disabled={placeBid.isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={placeBid.isPending || !bidAmount}
            className="bg-gold hover:bg-gold/90 text-background font-sans font-medium"
          >
            {placeBid.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Bidding…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Place Bid
              </span>
            )}
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-sans text-xs">{error}</p>
          </div>
        )}
      </div>
    </form>
  );
}
