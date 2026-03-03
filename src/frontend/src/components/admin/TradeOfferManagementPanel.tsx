import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { useState } from "react";
import {
  useCancelTradeOffer,
  useGetAllTradeOffers,
} from "../../hooks/useQueries";
import type { LocalTradeOffer } from "../../hooks/useQueries";

function TradeOfferStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-600 border-red-500/30",
    canceled: "bg-gray-500/15 text-gray-500 border-gray-500/30",
    countered: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  };
  const style =
    styles[status] ?? "bg-gray-500/15 text-gray-500 border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {status}
    </span>
  );
}

export default function TradeOfferManagementPanel() {
  const { data: offers = [], isLoading } = useGetAllTradeOffers();
  const cancelOffer = useCancelTradeOffer();
  const [sortBy, setSortBy] = useState<"status" | "date">("date");

  const sorted = [...offers].sort((a: LocalTradeOffer, b: LocalTradeOffer) => {
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return b.createdAt - a.createdAt;
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {["s1", "s2", "s3", "s4"].map((k) => (
          <Skeleton key={k} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <button
          type="button"
          onClick={() => setSortBy("date")}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${sortBy === "date" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setSortBy("status")}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${sortBy === "status" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Status
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No trade offers found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Offered By</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((offer: LocalTradeOffer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-mono text-xs">
                    {offer.id.slice(0, 10)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {String(offer.offererId).slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {String(offer.recipientId).slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <TradeOfferStatusBadge status={offer.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {offer.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelOffer.mutate(offer.id)}
                        disabled={cancelOffer.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
