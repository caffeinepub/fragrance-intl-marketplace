import React, { useState } from 'react';
import { useAcceptTradeOffer, useRejectTradeOffer, useCancelTradeOffer } from '../../hooks/useQueries';
import type { TradeOffer } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Ban, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

interface TradeOfferCardProps {
  offer: TradeOffer;
  perspective: 'incoming' | 'outgoing';
  onCounter?: (offer: TradeOffer) => void;
}

function TradeStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    accepted: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-600 border-red-500/30',
    canceled: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
    countered: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${variants[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  );
}

export default function TradeOfferCard({ offer, perspective, onCounter }: TradeOfferCardProps) {
  const acceptOffer = useAcceptTradeOffer();
  const rejectOffer = useRejectTradeOffer();
  const cancelOffer = useCancelTradeOffer();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'accept' | 'reject' | 'cancel') => {
    setActionLoading(action);
    try {
      if (action === 'accept') await acceptOffer.mutateAsync(offer.offerId);
      else if (action === 'reject') await rejectOffer.mutateAsync(offer.offerId);
      else await cancelOffer.mutateAsync(offer.offerId);
      toast.success(`Offer ${action}ed successfully`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} offer`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs text-muted-foreground">{offer.offerId.slice(0, 12)}…</span>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {new Date(offer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <TradeStatusBadge status={offer.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-sans text-xs text-muted-foreground mb-1">Offered</p>
          {offer.offeredItems.map((item, i) => (
            <p key={i} className="font-sans text-xs text-foreground">
              {item.productId.slice(0, 8)}… × {item.quantity}
            </p>
          ))}
        </div>
        <div>
          <p className="font-sans text-xs text-muted-foreground mb-1">Requested</p>
          {offer.requestedItems.map((item, i) => (
            <p key={i} className="font-sans text-xs text-foreground">
              {item.productId.slice(0, 8)}… × {item.quantity}
            </p>
          ))}
        </div>
      </div>

      {offer.cashAdjustment !== 0 && (
        <p className="font-sans text-xs text-muted-foreground">
          Cash adjustment: <span className="text-foreground font-medium">
            {offer.cashAdjustment > 0 ? '+' : ''}${(offer.cashAdjustment / 100).toFixed(2)}
          </span>
        </p>
      )}

      {offer.note && (
        <p className="font-sans text-xs text-muted-foreground italic">"{offer.note}"</p>
      )}

      {offer.status === 'pending' && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {perspective === 'incoming' && (
            <>
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs font-sans bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => handleAction('accept')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs font-sans border-red-500/30 text-red-600 hover:bg-red-500/10"
                onClick={() => handleAction('reject')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                Reject
              </Button>
              {onCounter && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-sans border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                  onClick={() => onCounter(offer)}
                  disabled={!!actionLoading}
                >
                  <ArrowLeftRight className="w-3 h-3 mr-1" />
                  Counter
                </Button>
              )}
            </>
          )}
          {perspective === 'outgoing' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-sans border-gray-500/30 text-gray-600 hover:bg-gray-500/10"
              onClick={() => handleAction('cancel')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
