import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCounterTradeOffer, type TradeOffer, type TradeItem } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface CounterOfferFormProps {
  originalOffer: TradeOffer;
  currentUserId: string;
  onSuccess?: () => void;
}

export default function CounterOfferForm({ originalOffer, currentUserId, onSuccess }: CounterOfferFormProps) {
  const counterOffer = useCounterTradeOffer();

  // Pre-fill with swapped items (counter = swap offered/requested)
  const [offeredItems, setOfferedItems] = useState<TradeItem[]>(
    originalOffer.requestedItems.map((i) => ({ ...i }))
  );
  const [requestedItems, setRequestedItems] = useState<TradeItem[]>(
    originalOffer.offeredItems.map((i) => ({ ...i }))
  );
  const [cashAdjustment, setCashAdjustment] = useState(String(-originalOffer.cashAdjustment));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const receiverId = currentUserId === originalOffer.initiatorId
    ? originalOffer.receiverId
    : originalOffer.initiatorId;

  const updateItem = (
    list: TradeItem[],
    setList: React.Dispatch<React.SetStateAction<TradeItem[]>>,
    idx: number,
    field: keyof TradeItem,
    value: string
  ) => {
    const updated = [...list];
    if (field === 'quantity') {
      updated[idx] = { ...updated[idx], quantity: Math.max(1, parseInt(value) || 1) };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setList(updated);
  };

  const addItem = (setList: React.Dispatch<React.SetStateAction<TradeItem[]>>) => {
    setList((prev) => [...prev, { productId: '', productName: '', quantity: 1 }]);
  };

  const removeItem = (setList: React.Dispatch<React.SetStateAction<TradeItem[]>>, idx: number) => {
    setList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validOffered = offeredItems.filter((i) => i.productName.trim());
    const validRequested = requestedItems.filter((i) => i.productName.trim());

    if (validOffered.length === 0) {
      setError('Add at least one item you are offering.');
      return;
    }
    if (validRequested.length === 0) {
      setError('Add at least one item you are requesting.');
      return;
    }

    const cash = parseInt(cashAdjustment) || 0;

    try {
      await counterOffer.mutateAsync({
        originalOfferId: originalOffer.id,
        initiatorId: currentUserId,
        receiverId,
        offeredItems: validOffered,
        requestedItems: validRequested,
        cashAdjustment: cash,
        note: note.trim() || undefined,
      });
      toast.success('Counter offer sent!');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send counter offer.';
      setError(msg);
    }
  };

  const ItemEditor = ({
    items,
    setItems,
    label,
  }: {
    items: TradeItem[];
    setItems: React.Dispatch<React.SetStateAction<TradeItem[]>>;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="font-sans text-sm">{label}</Label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input
            placeholder="Product name"
            value={item.productName}
            onChange={(e) => updateItem(items, setItems, idx, 'productName', e.target.value)}
            className="flex-1 font-sans text-sm"
          />
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(items, setItems, idx, 'quantity', e.target.value)}
            className="w-20 font-mono text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(setItems, idx)}
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addItem(setItems)}
        className="border-dashed border-gold/30 text-muted-foreground hover:text-gold hover:border-gold/60"
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Item
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ItemEditor items={offeredItems} setItems={setOfferedItems} label="You Offer" />
      <ItemEditor items={requestedItems} setItems={setRequestedItems} label="You Request" />

      <div className="space-y-1.5">
        <Label htmlFor="cash-adj" className="font-sans text-sm">
          Cash Adjustment (optional, positive = you pay extra)
        </Label>
        <Input
          id="cash-adj"
          type="number"
          value={cashAdjustment}
          onChange={(e) => setCashAdjustment(e.target.value)}
          placeholder="0"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note" className="font-sans text-sm">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a message to your counter offer…"
          rows={2}
          className="font-sans text-sm resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-sans text-xs">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={counterOffer.isPending}
        className="w-full bg-gold hover:bg-gold/90 text-background font-sans font-medium"
      >
        {counterOffer.isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            Sending…
          </span>
        ) : (
          'Send Counter Offer'
        )}
      </Button>
    </form>
  );
}
