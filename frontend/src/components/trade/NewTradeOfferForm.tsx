import React, { useState } from 'react';
import { useCreateTradeOffer } from '../../hooks/useQueries';
import type { TradeItem } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface NewTradeOfferFormProps {
  onClose?: () => void;
}

export default function NewTradeOfferForm({ onClose }: NewTradeOfferFormProps) {
  const createOffer = useCreateTradeOffer();
  const [recipientId, setRecipientId] = useState('');
  const [offeredProductId, setOfferedProductId] = useState('');
  const [offeredQty, setOfferedQty] = useState('1');
  const [requestedProductId, setRequestedProductId] = useState('');
  const [requestedQty, setRequestedQty] = useState('1');
  const [cashAdjustment, setCashAdjustment] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOffer.mutateAsync({
        recipientId,
        offeredItems: [{ productId: offeredProductId, quantity: BigInt(parseInt(offeredQty) || 1) }],
        requestedItems: [{ productId: requestedProductId, quantity: BigInt(parseInt(requestedQty) || 1) }],
        cashAdjustment: Math.round(parseFloat(cashAdjustment) * 100) || 0,
      });
      toast.success('Trade offer created!');
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create trade offer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Recipient Principal</label>
        <Input
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="aaaaa-aa..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Offered Product ID</label>
          <Input
            value={offeredProductId}
            onChange={(e) => setOfferedProductId(e.target.value)}
            placeholder="product-id"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Quantity</label>
          <Input
            type="number"
            min={1}
            value={offeredQty}
            onChange={(e) => setOfferedQty(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Requested Product ID</label>
          <Input
            value={requestedProductId}
            onChange={(e) => setRequestedProductId(e.target.value)}
            placeholder="product-id"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Quantity</label>
          <Input
            type="number"
            min={1}
            value={requestedQty}
            onChange={(e) => setRequestedQty(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Cash Adjustment ($)</label>
        <Input
          type="number"
          step="0.01"
          value={cashAdjustment}
          onChange={(e) => setCashAdjustment(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createOffer.isPending}>
          {createOffer.isPending ? 'Creating…' : 'Create Offer'}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
