import React, { useState } from 'react';
import { useAcceptTradeOffer, useRejectTradeOffer, useCancelTradeOffer } from '../../hooks/useQueries';
import type { LocalTradeOffer } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import TradeOfferStatusBadge from './TradeOfferStatusBadge';
import CounterOfferForm from './CounterOfferForm';
import { toast } from 'sonner';

interface TradeOfferCardProps {
  offer: LocalTradeOffer;
  currentUserId?: string;
}

export default function TradeOfferCard({ offer, currentUserId }: TradeOfferCardProps) {
  const acceptOffer = useAcceptTradeOffer();
  const rejectOffer = useRejectTradeOffer();
  const cancelOffer = useCancelTradeOffer();
  const [showCounter, setShowCounter] = useState(false);

  const isOfferer = String(offer.offererId) === currentUserId;
  const isRecipient = String(offer.recipientId) === currentUserId;

  const handleAccept = async () => {
    try {
      await acceptOffer.mutateAsync(offer.id);
      toast.success('Trade offer accepted');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to accept offer');
    }
  };

  const handleReject = async () => {
    try {
      await rejectOffer.mutateAsync(offer.id);
      toast.success('Trade offer rejected');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reject offer');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOffer.mutateAsync(offer.id);
      toast.success('Trade offer canceled');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to cancel offer');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground">{offer.id.slice(0, 14)}…</p>
        <TradeOfferStatusBadge status={offer.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Offered Items</p>
          {offer.offeredItems.map((item, i) => (
            <p key={i} className="text-foreground">
              {item.productId.slice(0, 8)}… × {item.quantity}
            </p>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Requested Items</p>
          {offer.requestedItems.map((item, i) => (
            <p key={i} className="text-foreground">
              {item.productId.slice(0, 8)}… × {item.quantity}
            </p>
          ))}
        </div>
      </div>

      {offer.cashAdjustment !== 0 && (
        <p className="text-sm text-muted-foreground">
          Cash adjustment: <span className="font-medium text-foreground">${(offer.cashAdjustment / 100).toFixed(2)}</span>
        </p>
      )}

      {offer.note && (
        <p className="font-sans text-xs text-muted-foreground italic">"{offer.note}"</p>
      )}

      {offer.status === 'pending' && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {isRecipient && (
            <>
              <Button size="sm" onClick={handleAccept} disabled={acceptOffer.isPending}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={rejectOffer.isPending}>
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCounter(!showCounter)}>
                Counter
              </Button>
            </>
          )}
          {isOfferer && (
            <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancelOffer.isPending}>
              Cancel
            </Button>
          )}
        </div>
      )}

      {showCounter && (
        <CounterOfferForm originalOffer={offer} onClose={() => setShowCounter(false)} />
      )}
    </div>
  );
}
