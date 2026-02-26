import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Auction } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Gavel } from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
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

export default function AuctionCard({ auction }: AuctionCardProps) {
  const countdown = useCountdown(auction.endTime);
  const navigate = useNavigate();

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    ended: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    canceled: 'bg-red-500/15 text-red-600 border-red-500/30',
  };

  return (
    <div className="bg-card border border-border rounded p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base text-foreground line-clamp-2">{auction.title}</h3>
        <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[auction.status] ?? ''}`}>
          {auction.status}
        </Badge>
      </div>

      {auction.description && (
        <p className="font-sans text-xs text-muted-foreground line-clamp-2">{auction.description}</p>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-sans">
          <span className="text-muted-foreground">Starting Price</span>
          <span className="text-foreground">${(auction.startingPrice / 100).toFixed(2)}</span>
        </div>
        {auction.currentBid != null && (
          <div className="flex justify-between text-xs font-sans">
            <span className="text-muted-foreground">Current Bid</span>
            <span className="text-gold font-medium">${(auction.currentBid / 100).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{auction.status === 'active' ? countdown : 'Auction ended'}</span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-auto border-gold/30 text-bronze hover:bg-gold/5"
        onClick={() => navigate({ to: '/auctions/$auctionId', params: { auctionId: auction.auctionId } })}
      >
        <Gavel className="w-3 h-3 mr-1.5" />
        View Auction
      </Button>
    </div>
  );
}
