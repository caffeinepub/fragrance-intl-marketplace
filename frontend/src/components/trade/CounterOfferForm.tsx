import React, { useState } from 'react';
import { useCounterTradeOffer } from '../../hooks/useQueries';
import type { TradeOffer, TradeItem } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CounterOfferFormProps {
  originalOffer: TradeOffer;
  onClose: () => void;
}

export default function CounterOfferForm({ originalOffer, onClose }: CounterOfferFormProps) {
  const counterOffer = useCounterTradeOffer();
  const [cashAdjustment, setCashAdjustment] = useState('0');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await counterOffer.mutateAsync({
        offerId: originalOffer.offerId,
        offeredItems: originalOffer.requestedItems.map((item: TradeItem) => ({
          productId: item.productId,
          quantity: BigInt(item.quantity),
        })),
        requestedItems: originalOffer.offeredItems.map((item: TradeItem) => ({
          productId: item.productId,
          quantity: BigInt(item.quantity),
        })),
        cashAdjustment: BigInt(Math.round(parseFloat(cashAdjustment) * 100) || 0),
        note: note.trim() || '',
      });
      toast.success('Counter offer sent!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send counter offer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Cash Adjustment ($)</Label>
        <Input
          type="number"
          step="0.01"
          value={cashAdjustment}
          onChange={(e) => setCashAdjustment(e.target.value)}
          className="font-sans text-sm border-border"
          disabled={counterOffer.isPending}
        />
        <p className="text-xs text-muted-foreground font-sans">
          Positive = you receive cash, Negative = you pay cash
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to your counter offer…"
          className="font-sans text-sm border-border"
          disabled={counterOffer.isPending}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={counterOffer.isPending}
          className="font-sans border-border">
          Cancel
        </Button>
        <Button type="submit" disabled={counterOffer.isPending}
          className="font-sans bg-gold text-background hover:bg-gold/90">
          {counterOffer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Send Counter Offer
        </Button>
      </div>
    </form>
  );
}
