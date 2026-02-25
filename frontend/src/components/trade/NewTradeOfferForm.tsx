import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCreateTradeOffer, type TradeItem } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface NewTradeOfferFormProps {
  currentUserId: string;
}

export default function NewTradeOfferForm({ currentUserId }: NewTradeOfferFormProps) {
  const navigate = useNavigate();
  const createOffer = useCreateTradeOffer();

  const [receiverId, setReceiverId] = useState('');
  const [offeredItems, setOfferedItems] = useState<TradeItem[]>([{ productId: '', productName: '', quantity: 1 }]);
  const [requestedItems, setRequestedItems] = useState<TradeItem[]>([{ productId: '', productName: '', quantity: 1 }]);
  const [cashAdjustment, setCashAdjustment] = useState('0');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

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

    if (!receiverId.trim()) {
      setError('Please enter the receiver\'s principal ID.');
      return;
    }
    if (receiverId.trim() === currentUserId) {
      setError('You cannot send a trade offer to yourself.');
      return;
    }

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
      await createOffer.mutateAsync({
        initiatorId: currentUserId,
        receiverId: receiverId.trim(),
        offeredItems: validOffered,
        requestedItems: validRequested,
        cashAdjustment: cash,
        note: note.trim() || undefined,
      });
      toast.success('Trade offer sent successfully!');
      navigate({ to: '/trade-offers' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create trade offer.';
      setError(msg);
    }
  };

  const ItemEditor = ({
    items,
    setItems,
    label,
    description,
  }: {
    items: TradeItem[];
    setItems: React.Dispatch<React.SetStateAction<TradeItem[]>>;
    label: string;
    description: string;
  }) => (
    <div className="space-y-3">
      <div>
        <Label className="font-sans text-sm font-medium">{label}</Label>
        <p className="font-sans text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              placeholder="Product name or ID"
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
              title="Quantity"
            />
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(setItems, idx)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Receiver */}
      <div className="space-y-1.5">
        <Label htmlFor="receiver-id" className="font-sans text-sm font-medium">
          Receiver's Principal ID
        </Label>
        <p className="font-sans text-xs text-muted-foreground">
          Enter the principal ID of the user you want to trade with.
        </p>
        <Input
          id="receiver-id"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          placeholder="e.g. aaaaa-aa or 2vxsx-fae…"
          className="font-mono text-sm"
        />
      </div>

      {/* Offered Items */}
      <ItemEditor
        items={offeredItems}
        setItems={setOfferedItems}
        label="Items You Offer"
        description="Products from your inventory that you are willing to trade away."
      />

      {/* Requested Items */}
      <ItemEditor
        items={requestedItems}
        setItems={setRequestedItems}
        label="Items You Request"
        description="Products you want to receive in exchange."
      />

      {/* Cash Adjustment */}
      <div className="space-y-1.5">
        <Label htmlFor="cash-adj" className="font-sans text-sm font-medium">
          Cash Adjustment (optional)
        </Label>
        <p className="font-sans text-xs text-muted-foreground">
          Positive = you pay extra cash. Negative = receiver pays extra cash.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-sans text-sm">$</span>
          <Input
            id="cash-adj"
            type="number"
            value={cashAdjustment}
            onChange={(e) => setCashAdjustment(e.target.value)}
            placeholder="0"
            className="pl-7 font-mono"
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note" className="font-sans text-sm font-medium">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a message to accompany your trade offer…"
          rows={3}
          className="font-sans text-sm resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-sans text-xs">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/trade-offers' })}
          className="flex-1 border-border font-sans"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createOffer.isPending}
          className="flex-1 bg-gold hover:bg-gold/90 text-background font-sans font-medium"
        >
          {createOffer.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Sending…
            </span>
          ) : (
            'Send Trade Offer'
          )}
        </Button>
      </div>
    </form>
  );
}
