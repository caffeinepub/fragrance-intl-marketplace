import React, { useState } from 'react';
import { useGetAllAuctions, useCancelAuction, useFinalizeAuction } from '../../hooks/useQueries';
import type { Auction } from '../../types';
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
import { Gavel, XCircle, CheckCircle, ArrowUpDown } from 'lucide-react';

type SortField = 'status' | 'endTime' | 'createdAt';

function AuctionStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    ended: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    canceled: 'bg-red-500/15 text-red-600 border-red-500/30',
  };
  return (
    <Badge variant="outline" className={`text-xs ${variants[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  );
}

export default function AuctionManagementPanel() {
  const { data: auctions, isLoading } = useGetAllAuctions();
  const cancelAuction = useCancelAuction();
  const finalizeAuction = useFinalizeAuction();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...(auctions ?? [])].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'status') cmp = a.status.localeCompare(b.status);
    else if (sortField === 'endTime') cmp = a.endTime - b.endTime;
    else cmp = a.createdAt - b.createdAt;
    return sortAsc ? cmp : -cmp;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gavel className="w-5 h-5 text-gold" />
        <h3 className="font-serif text-lg text-foreground">All Auctions</h3>
        <Badge variant="secondary" className="ml-auto">{sorted.length}</Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-sans text-sm">No auctions found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Title</TableHead>
                <TableHead className="font-sans text-xs">Vendor</TableHead>
                <TableHead
                  className="font-sans text-xs cursor-pointer select-none"
                  onClick={() => toggleSort('status')}
                >
                  <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="font-sans text-xs">Current Bid</TableHead>
                <TableHead
                  className="font-sans text-xs cursor-pointer select-none"
                  onClick={() => toggleSort('endTime')}
                >
                  <span className="flex items-center gap-1">End Time <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="font-sans text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((auction) => (
                <TableRow key={auction.auctionId}>
                  <TableCell className="font-sans text-sm">{auction.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {auction.vendorId.slice(0, 8)}…
                  </TableCell>
                  <TableCell><AuctionStatusBadge status={auction.status} /></TableCell>
                  <TableCell className="font-sans text-sm">
                    {auction.currentBid != null ? `$${(auction.currentBid / 100).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">
                    {new Date(auction.endTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {auction.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
                            onClick={() => cancelAuction.mutate(auction.auctionId)}
                            disabled={cancelAuction.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => finalizeAuction.mutate(auction.auctionId)}
                            disabled={finalizeAuction.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
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
      )}
    </div>
  );
}
