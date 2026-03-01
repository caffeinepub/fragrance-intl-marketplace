import React from 'react';
import { useGetAllAuctions, useCancelAuction, useFinalizeAuction } from '../../hooks/useQueries';
import type { LocalAuction } from '../../hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function AuctionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    ended: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
    canceled: 'bg-red-500/15 text-red-600 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  };
  const style = styles[status] ?? 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

export default function AuctionManagementPanel() {
  const { data: auctions = [], isLoading } = useGetAllAuctions();
  const cancelAuction = useCancelAuction();
  const finalizeAuction = useFinalizeAuction();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">No auctions found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction: LocalAuction) => (
            <TableRow key={auction.id}>
              <TableCell className="font-mono text-xs">{auction.id.slice(0, 10)}…</TableCell>
              <TableCell>{auction.title}</TableCell>
              <TableCell>
                <AuctionStatusBadge status={auction.status} />
              </TableCell>
              <TableCell>
                {auction.currentBid != null ? formatPrice(auction.currentBid) : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(auction.endTime).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {auction.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelAuction.mutate(auction.id)}
                        disabled={cancelAuction.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => finalizeAuction.mutate(auction.id)}
                        disabled={finalizeAuction.isPending}
                      >
                        Finalize
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
