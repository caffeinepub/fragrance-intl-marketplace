import React, { useState } from 'react';
import { useCreateTradeOffer } from '../../hooks/useQueries';
import type { TradeItem } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewTradeOfferForm() {
  const createTradeOffer = useCreateTradeOffer();

  const [offeredItems, setOfferedItems] = useState<TradeItem[]>([{ productId: '', quantity: 1 }]);
  const [requestedItems, setRequestedItems] = useState<TradeItem[]>([{ productId: '', quantity: 1 }]);
  const [cashAdjustment, setCashAdjustment] = useState('0');
  const [note, setNote] = useState('');
  const [targetPrincipal, setTargetPrincipal] = useState('');

  const addItem = (setter: React.Dispatch<React.SetStateAction<TradeItem[]>>) => {
    setter((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<TradeItem[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<TradeItem[]>>,
    index: number,
    field: keyof TradeItem,
    value: string | number,
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrincipal.trim()) {
      toast.error('Please enter the target principal');
      return;
    }
    try {
      await createTradeOffer.mutateAsync({
        offeredItems: offeredItems.map((item) => ({
          productId: item.productId,
          quantity: BigInt(item.quantity),
        })),
        requestedItems: requestedItems.map((item) => ({
          productId: item.productId,
          quantity: BigInt(item.quantity),
        })),
        cashAdjustment: BigInt(Math.round(parseFloat(cashAdjustment) * 100) || 0),
        note: note.trim() || '',
        targetPrincipal: targetPrincipal.trim(),
      });
      toast.success('Trade offer created!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trade offer');
    }
  };

  const renderItemList = (
    items: TradeItem[],
    setter: React.Dispatch<React.SetStateAction<TradeItem[]>>,
    label: string,
  ) => (
    <div className="space-y-2">
      <Label className="font-sans text-sm">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={item.productId}
            onChange={(e) => updateItem(setter, i, 'productId', e.target.value)}
            placeholder="Product ID"
            className="font-sans text-sm border-border flex-1"
            disabled={createTradeOffer.isPending}
          />
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => updateItem(setter, i, 'quantity', parseInt(e.target.value) || 1)}
            className="font-sans text-sm border-border w-20"
            disabled={createTradeOffer.isPending}
          />
          {items.length > 1 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(setter, i)}
              disabled={createTradeOffer.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => addItem(setter)}
        disabled={createTradeOffer.isPending}
        className="font-sans text-xs border-border h-7"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Item
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Target Principal</Label>
        <Input
          value={targetPrincipal}
          onChange={(e) => setTargetPrincipal(e.target.value)}
          placeholder="Principal ID of the other party"
          className="font-sans text-sm border-border"
          disabled={createTradeOffer.isPending}
        />
      </div>

      {renderItemList(offeredItems, setOfferedItems, 'Items You Offer')}
      {renderItemList(requestedItems, setRequestedItems, 'Items You Request')}

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Cash Adjustment ($)</Label>
        <Input
          type="number"
          step="0.01"
          value={cashAdjustment}
          onChange={(e) => setCashAdjustment(e.target.value)}
          className="font-sans text-sm border-border"
          disabled={createTradeOffer.isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Note (optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to your trade offer…"
          rows={3}
          className="font-sans text-sm border-border resize-none"
          disabled={createTradeOffer.isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={createTradeOffer.isPending}
        className="w-full font-sans bg-gold text-background hover:bg-gold/90"
      >
        {createTradeOffer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Trade Offer
      </Button>
    </form>
  );
}
