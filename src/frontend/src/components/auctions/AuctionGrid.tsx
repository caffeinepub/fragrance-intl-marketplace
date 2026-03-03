import React from "react";
import type { LocalAuction } from "../../hooks/useQueries";
import AuctionCard from "./AuctionCard";

interface AuctionGridProps {
  auctions: LocalAuction[];
}

export default function AuctionGrid({ auctions }: AuctionGridProps) {
  if (!auctions || auctions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No auctions to display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions
        .filter((a) => a != null && a.id != null)
        .map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
    </div>
  );
}
