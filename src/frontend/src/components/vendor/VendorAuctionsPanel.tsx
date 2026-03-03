import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Gavel, Loader2, Plus, XCircle } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useCancelAuction, useGetVendorAuctions } from "../../hooks/useQueries";
import type { LocalAuction } from "../../hooks/useQueries";
import CreateAuctionForm from "./CreateAuctionForm";

interface VendorAuctionsPanelProps {
  vendorId: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function useCountdown(endTime: number) {
  const [timeLeft, setTimeLeft] = React.useState("");
  React.useEffect(() => {
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return timeLeft;
}

function AuctionRow({
  auction,
  onCancel,
}: { auction: LocalAuction; onCancel: (id: string) => void }) {
  const countdown = useCountdown(auction.endTime);
  const cancelAuction = useCancelAuction();
  const [canceling, setCanceling] = React.useState(false);

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    ended: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    canceled: "bg-red-500/15 text-red-600 border-red-500/30",
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await cancelAuction.mutateAsync(auction.id);
      toast.success("Auction canceled");
      onCancel(auction.id);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel auction",
      );
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded p-3">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-foreground truncate">
          {auction.title}
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          {auction.status === "active" ? countdown : "Auction ended"} ·{" "}
          {auction.bids.length} bid{auction.bids.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {auction.currentBid != null && (
          <span className="font-sans text-sm text-gold font-medium">
            {formatPrice(auction.currentBid)}
          </span>
        )}
        <Badge
          variant="outline"
          className={`text-xs ${statusColors[auction.status] ?? ""}`}
        >
          {auction.status}
        </Badge>
        {auction.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
            onClick={handleCancel}
            disabled={canceling}
          >
            {canceling ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VendorAuctionsPanel({
  vendorId,
}: VendorAuctionsPanelProps) {
  const { data: auctions, isLoading } = useGetVendorAuctions();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Collapsible open={showForm} onOpenChange={setShowForm}>
        <CollapsibleTrigger asChild>
          <Button
            size="sm"
            className="font-sans bg-gold text-background hover:bg-gold/90"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showForm ? "Hide Form" : "Create Auction"}
            <ChevronDown
              className={`w-3.5 h-3.5 ml-1.5 transition-transform ${showForm ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="bg-background border border-border rounded p-4">
            <CreateAuctionForm
              _vendorId={vendorId}
              onCreated={() => setShowForm(false)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {!auctions || auctions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded">
          <Gavel className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="font-sans text-sm text-muted-foreground">
            No auctions yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(auctions as LocalAuction[]).map((auction) => (
            <AuctionRow
              key={auction.id}
              auction={auction}
              onCancel={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
