import React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, TrendingUp } from 'lucide-react';
import AuctionCountdown from './AuctionCountdown';
import AuctionStatusBadge from './AuctionStatusBadge';
import type { Auction } from '../../hooks/useQueries';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const isEnded = auction.status !== 'active' || Date.now() >= auction.endTime;

  return (
    <Link to="/auctions/$auctionId" params={{ auctionId: auction.id }}>
      <Card className={`group overflow-hidden border border-border hover:border-gold/40 transition-all duration-200 hover:shadow-md cursor-pointer ${isEnded ? 'opacity-75' : ''}`}>
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={auction.productImage || '/assets/generated/product-placeholder.dim_600x600.png'}
            alt={auction.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <AuctionStatusBadge status={isEnded ? 'ended' : auction.status} />
          </div>
          {!isEnded && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <AuctionCountdown endTime={auction.endTime} compact />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-serif text-base text-foreground mb-3 line-clamp-2 group-hover:text-gold transition-colors">
            {auction.productName}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-muted-foreground">Current Bid</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold" />
                <span className="font-serif text-base font-semibold text-gold">
                  ${auction.currentBid.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-muted-foreground">Starting Price</span>
              <span className="font-sans text-xs text-muted-foreground">
                ${auction.startingPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Gavel className="w-3.5 h-3.5" />
                <span className="font-sans text-xs">{auction.bidHistory.length} bid{auction.bidHistory.length !== 1 ? 's' : ''}</span>
              </div>
              {isEnded && auction.highestBidderId && (
                <span className="font-sans text-xs text-emerald-600 dark:text-emerald-400">
                  Winner: {auction.highestBidderId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
