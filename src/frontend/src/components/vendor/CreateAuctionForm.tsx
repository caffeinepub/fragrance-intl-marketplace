import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateAuction } from "../../hooks/useQueries";

interface CreateAuctionFormProps {
  storeId?: string;
  _vendorId?: string;
  onCreated?: () => void;
}

export default function CreateAuctionForm({
  storeId,
  _vendorId,
  onCreated,
}: CreateAuctionFormProps) {
  const createAuction = useCreateAuction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number.parseFloat(startingPrice);
    const parsedEnd = new Date(endTime).getTime();

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid starting price");
      return;
    }
    if (Number.isNaN(parsedEnd) || parsedEnd <= Date.now()) {
      toast.error("Please enter a valid future end time");
      return;
    }

    try {
      await createAuction.mutateAsync({
        productId,
        storeId: storeId ?? "",
        vendorId: _vendorId ?? "",
        title,
        description,
        startingPrice: Math.round(parsedPrice * 100),
        currentPrice: Math.round(parsedPrice * 100),
        minBidIncrement: 100,
        endTime: parsedEnd,
        status: "active",
        winnerId: undefined,
      });
      toast.success("Auction created!");
      setTitle("");
      setDescription("");
      setProductId("");
      setStartingPrice("");
      setEndTime("");
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create auction");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="auction-title"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          Title
        </label>
        <Input
          id="auction-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label
          htmlFor="auction-description"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          Description
        </label>
        <Input
          id="auction-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="auction-product-id"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          Product ID
        </label>
        <Input
          id="auction-product-id"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="product-id"
        />
      </div>
      <div>
        <label
          htmlFor="auction-starting-price"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          Starting Price ($)
        </label>
        <Input
          id="auction-starting-price"
          type="number"
          step="0.01"
          min="0.01"
          value={startingPrice}
          onChange={(e) => setStartingPrice(e.target.value)}
          required
        />
      </div>
      <div>
        <label
          htmlFor="auction-end-time"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          End Time
        </label>
        <Input
          id="auction-end-time"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={createAuction.isPending}
        className="w-full"
      >
        {createAuction.isPending ? "Creating…" : "Create Auction"}
      </Button>
    </form>
  );
}
