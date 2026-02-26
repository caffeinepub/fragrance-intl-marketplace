import React from 'react';
import type { TradeOffer } from '../../types';
import TradeOfferCard from './TradeOfferCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TradeOfferGridProps {
  offers: TradeOffer[];
  perspective: 'incoming' | 'outgoing';
  isLoading?: boolean;
  onCounter?: (offer: TradeOffer) => void;
}

export default function TradeOfferGrid({ offers, perspective, isLoading, onCounter }: TradeOfferGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded" />)}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="font-sans text-sm text-muted-foreground">No trade offers found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <TradeOfferCard
          key={offer.offerId}
          offer={offer}
          perspective={perspective}
          onCounter={onCounter}
        />
      ))}
    </div>
  );
}
