import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TradeOfferCard from './TradeOfferCard';
import type { TradeOffer } from '../../hooks/useQueries';
import { ArrowLeftRight } from 'lucide-react';

interface TradeOfferGridProps {
  offers: TradeOffer[];
  currentUserId: string;
  isLoading?: boolean;
  emptyMessage?: string;
  onAction?: () => void;
}

export default function TradeOfferGrid({
  offers,
  currentUserId,
  isLoading,
  emptyMessage = 'No trade offers found.',
  onAction,
}: TradeOfferGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ArrowLeftRight className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
        <p className="font-serif text-lg text-foreground mb-1">No Offers</p>
        <p className="font-sans text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers.map((offer) => (
        <TradeOfferCard
          key={offer.id}
          offer={offer}
          currentUserId={currentUserId}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
