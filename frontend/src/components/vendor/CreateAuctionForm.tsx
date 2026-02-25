import React, { useState } from 'react';
import { useCreateAuction, useSearchProducts } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAuctionFormProps {
  vendorId: string;
  onSuccess?: () => void;
}

export default function CreateAuctionForm({ vendorId, onSuccess }: CreateAuctionFormProps) {
  const createAuction = useCreateAuction();
  const { data: products } = useSearchProducts({ keyword: undefined, category: undefined, productType: undefined, sortBy: undefined });

  const vendorProducts = (products ?? []).filter((p) => p.vendorId === vendorId);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid starting price.');
      return;
    }
    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid duration.');
      return;
    }

    const product = vendorProducts.find((p) => p.id === selectedProductId);
    if (!product) {
      setError('Selected product not found.');
      return;
    }

    try {
      await createAuction.mutateAsync({
        vendorId,
        productId: selectedProductId,
        productName: product.title,
        startingPrice: price,
        durationHours: hours,
      });
      toast.success('Auction created successfully!');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create auction.';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Product</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product…" />
          </SelectTrigger>
          <SelectContent>
            {vendorProducts.length === 0 ? (
              <SelectItem value="__none__" disabled>No products available</SelectItem>
            ) : (
              vendorProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} — ${Number(p.price).toFixed(2)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="starting-price" className="font-sans text-sm">Starting Price ($)</Label>
        <Input
          id="starting-price"
          type="number"
          step="0.01"
          min="0.01"
          value={startingPrice}
          onChange={(e) => setStartingPrice(e.target.value)}
          placeholder="e.g. 50.00"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="duration" className="font-sans text-sm">Duration (hours)</Label>
        <Select value={durationHours} onValueChange={setDurationHours}>
          <SelectTrigger id="duration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 hour</SelectItem>
            <SelectItem value="6">6 hours</SelectItem>
            <SelectItem value="12">12 hours</SelectItem>
            <SelectItem value="24">24 hours</SelectItem>
            <SelectItem value="48">48 hours</SelectItem>
            <SelectItem value="72">72 hours</SelectItem>
            <SelectItem value="168">7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-sans text-xs">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={createAuction.isPending}
        className="w-full bg-gold hover:bg-gold/90 text-background font-sans font-medium"
      >
        {createAuction.isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            Creating…
          </span>
        ) : (
          'Create Auction'
        )}
      </Button>
    </form>
  );
}
