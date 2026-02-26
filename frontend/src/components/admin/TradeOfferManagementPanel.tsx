import React, { useState } from 'react';
import { useGetAllTradeOffers, useCancelTradeOffer } from '../../hooks/useQueries';
import type { TradeOffer } from '../../types';
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
import { ArrowLeftRight, XCircle, ArrowUpDown } from 'lucide-react';

type SortField = 'status' | 'createdAt';

function TradeStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    accepted: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-600 border-red-500/30',
    canceled: 'bg-gray-500/15 text-gray-600 border-gray-500/30',
    countered: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${variants[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  );
}

export default function TradeOfferManagementPanel() {
  const { data: offers, isLoading } = useGetAllTradeOffers();
  const cancelOffer = useCancelTradeOffer();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...(offers ?? [])].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'status') cmp = a.status.localeCompare(b.status);
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
        <ArrowLeftRight className="w-5 h-5 text-gold" />
        <h3 className="font-serif text-lg text-foreground">All Trade Offers</h3>
        <Badge variant="secondary" className="ml-auto">{sorted.length}</Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-sans text-sm">No trade offers found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Offer ID</TableHead>
                <TableHead className="font-sans text-xs">From</TableHead>
                <TableHead className="font-sans text-xs">To</TableHead>
                <TableHead
                  className="font-sans text-xs cursor-pointer select-none"
                  onClick={() => toggleSort('status')}
                >
                  <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead
                  className="font-sans text-xs cursor-pointer select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="font-sans text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((offer) => (
                <TableRow key={offer.offerId}>
                  <TableCell className="font-mono text-xs">{offer.offerId.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {offer.offeredBy.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {offer.targetPrincipal.slice(0, 8)}…
                  </TableCell>
                  <TableCell><TradeStatusBadge status={offer.status} /></TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {offer.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
                        onClick={() => cancelOffer.mutate(offer.offerId)}
                        disabled={cancelOffer.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
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
