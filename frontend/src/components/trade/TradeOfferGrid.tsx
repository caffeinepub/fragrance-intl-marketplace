import React from 'react';
import TradeOfferCard from './TradeOfferCard';
import type { LocalTradeOffer } from '../../hooks/useQueries';

interface TradeOfferGridProps {
  offers: LocalTradeOffer[];
  currentUserId?: string;
}

export default function TradeOfferGrid({ offers, currentUserId }: TradeOfferGridProps) {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No trade offers to display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers
        .filter((o) => o != null && o.id != null)
        .map((offer) => (
          <TradeOfferCard key={offer.id} offer={offer} currentUserId={currentUserId} />
        ))}
    </div>
  );
}
