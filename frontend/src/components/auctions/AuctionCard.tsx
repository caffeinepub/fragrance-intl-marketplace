import React from 'react';
import { Clock, Gavel } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import AuctionStatusBadge from './AuctionStatusBadge';
import type { LocalAuction } from '../../hooks/useQueries';

interface AuctionCardProps {
  auction: LocalAuction;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTimeLeft(endTime: number) {
  const diff = endTime - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{auction.title}</h3>
          <AuctionStatusBadge status={auction.status} />
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{auction.description}</p>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Starting Price</span>
            <span className="font-medium">{formatPrice(auction.startingPrice)}</span>
          </div>
          {auction.currentBid != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Bid</span>
              <span className="text-primary font-medium">{formatPrice(auction.currentBid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Time Left
            </span>
            <span className="font-medium">{formatTimeLeft(auction.endTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bids</span>
            <span className="font-medium">{auction.bids.length}</span>
          </div>
        </div>

        <Button
          className="mt-auto w-full gap-2"
          onClick={() => navigate({ to: '/auctions/$auctionId', params: { auctionId: auction.id } })}
        >
          <Gavel className="w-4 h-4" />
          {auction.status === 'active' ? 'Place Bid' : 'View Auction'}
        </Button>
      </div>
    </div>
  );
}
