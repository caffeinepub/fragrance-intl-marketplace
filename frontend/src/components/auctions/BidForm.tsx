import React, { useState } from 'react';
import { usePlaceBid } from '../../hooks/useQueries';
import type { LocalAuction } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BidFormProps {
  auction: LocalAuction;
}

export default function BidForm({ auction }: BidFormProps) {
  const placeBid = usePlaceBid();
  const [amount, setAmount] = useState('');

  const currentBidCents = auction.currentBid ?? auction.currentPrice ?? auction.startingPrice;
  const minBid = (currentBidCents / 100) + 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < minBid) {
      toast.error(`Bid must be at least ${minBid.toFixed(2)}`);
      return;
    }
    try {
      await placeBid.mutateAsync({
        auctionId: auction.id,
        amount: Math.round(parsed * 100),
      });
      toast.success('Bid placed successfully!');
      setAmount('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to place bid');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Your Bid (min: ${minBid.toFixed(2)})
        </label>
        <Input
          type="number"
          step="0.01"
          min={minBid}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`${minBid.toFixed(2)}`}
          required
        />
      </div>
      <Button type="submit" disabled={placeBid.isPending} className="w-full">
        {placeBid.isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Placing Bid…
          </span>
        ) : (
          'Place Bid'
        )}
      </Button>
    </form>
  );
}
