import React, { useState } from 'react';
import { useCreateAuction } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Gavel } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAuctionFormProps {
  vendorId: string;
  onSuccess?: () => void;
}

export default function CreateAuctionForm({ vendorId: _vendorId, onSuccess }: CreateAuctionFormProps) {
  const createAuction = useCreateAuction();
  const [form, setForm] = useState({
    productId: '',
    title: '',
    description: '',
    startingPrice: '',
    reservePrice: '',
    endTime: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startingPrice || !form.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseFloat(form.startingPrice);
    const endDate = new Date(form.endTime).getTime();

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid starting price');
      return;
    }
    if (isNaN(endDate) || endDate <= Date.now()) {
      toast.error('End time must be in the future');
      return;
    }

    try {
      await createAuction.mutateAsync({
        productId: form.productId.trim(),
        startingPrice: BigInt(Math.round(price * 100)),
        endTime: BigInt(endDate),
      });
      toast.success('Auction created successfully!');
      setForm({ productId: '', title: '', description: '', startingPrice: '', reservePrice: '', endTime: '' });
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create auction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Auction title"
            className="font-sans text-sm border-border"
            disabled={createAuction.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">Product ID</Label>
          <Input
            value={form.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            placeholder="Optional product ID"
            className="font-sans text-sm border-border"
            disabled={createAuction.isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the auction item…"
          rows={3}
          className="font-sans text-sm border-border resize-none"
          disabled={createAuction.isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            Starting Price ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.startingPrice}
            onChange={(e) => handleChange('startingPrice', e.target.value)}
            placeholder="0.00"
            className="font-sans text-sm border-border"
            disabled={createAuction.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">Reserve Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.reservePrice}
            onChange={(e) => handleChange('reservePrice', e.target.value)}
            placeholder="Optional"
            className="font-sans text-sm border-border"
            disabled={createAuction.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm">
            End Time <span className="text-destructive">*</span>
          </Label>
          <Input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            className="font-sans text-sm border-border"
            disabled={createAuction.isPending}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={createAuction.isPending}
        className="font-sans bg-gold text-background hover:bg-gold/90"
      >
        {createAuction.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <Gavel className="w-4 h-4 mr-2" />
        Create Auction
      </Button>
    </form>
  );
}
