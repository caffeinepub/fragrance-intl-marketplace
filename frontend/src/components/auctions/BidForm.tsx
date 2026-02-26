import React, { useState } from 'react';
import { usePlaceBid } from '../../hooks/useQueries';
import type { Auction } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Gavel } from 'lucide-react';
import { toast } from 'sonner';

interface BidFormProps {
  auction: Auction;
}

export default function BidForm({ auction }: BidFormProps) {
  const [bidInput, setBidInput] = useState('');
  const placeBid = usePlaceBid();

  const minBid = auction.currentBid != null
    ? auction.currentBid + 1
    : auction.startingPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidInput);
    if (isNaN(amount) || amount * 100 < minBid) {
      toast.error(`Bid must be at least $${(minBid / 100).toFixed(2)}`);
      return;
    }
    try {
      await placeBid.mutateAsync({
        auctionId: auction.auctionId,
        amount: BigInt(Math.round(amount * 100)),
      });
      toast.success('Bid placed successfully!');
      setBidInput('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to place bid');
    }
  };

  if (auction.status !== 'active') {
    return (
      <p className="font-sans text-sm text-muted-foreground text-center py-4">
        This auction is no longer accepting bids.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="bid-amount" className="font-sans text-sm">
          Your Bid (min ${(minBid / 100).toFixed(2)})
        </Label>
        <Input
          id="bid-amount"
          type="number"
          step="0.01"
          min={(minBid / 100).toFixed(2)}
          value={bidInput}
          onChange={(e) => setBidInput(e.target.value)}
          placeholder={`$${(minBid / 100).toFixed(2)}`}
          className="font-sans text-sm border-border"
          disabled={placeBid.isPending}
        />
      </div>
      <Button
        type="submit"
        disabled={placeBid.isPending || !bidInput}
        className="w-full font-sans bg-gold text-background hover:bg-gold/90"
      >
        {placeBid.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Gavel className="w-4 h-4 mr-2" />
        )}
        Place Bid
      </Button>
    </form>
  );
}
