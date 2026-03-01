import React, { useState } from 'react';
import { useCounterTradeOffer } from '../../hooks/useQueries';
import type { LocalTradeOffer } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CounterOfferFormProps {
  originalOffer: LocalTradeOffer;
  onClose: () => void;
}

export default function CounterOfferForm({ originalOffer, onClose }: CounterOfferFormProps) {
  const counterOffer = useCounterTradeOffer();
  const [cashAdjustment, setCashAdjustment] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await counterOffer.mutateAsync({
        offerId: originalOffer.id,
        counterOffer: {
          offeredItems: originalOffer.requestedItems.map((item) => ({
            productId: item.productId,
            quantity: BigInt(item.quantity),
          })),
          requestedItems: originalOffer.offeredItems.map((item) => ({
            productId: item.productId,
            quantity: BigInt(item.quantity),
          })),
          cashAdjustment: Math.round(parseFloat(cashAdjustment) * 100) || 0,
        },
      });
      toast.success('Counter offer sent');
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send counter offer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <p className="text-sm font-medium text-foreground">Counter Offer</p>
      <p className="text-xs text-muted-foreground">
        Your counter will swap the offered and requested items. Adjust the cash amount below.
      </p>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Cash Adjustment ($)
        </label>
        <Input
          type="number"
          step="0.01"
          value={cashAdjustment}
          onChange={(e) => setCashAdjustment(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={counterOffer.isPending}>
          Send Counter
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
