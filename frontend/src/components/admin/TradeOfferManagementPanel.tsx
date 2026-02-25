import React, { useState } from 'react';
import { useListAllTradeOffers, useCancelTradeOffer, type TradeOffer } from '../../hooks/useQueries';
import TradeOfferStatusBadge from '../trade/TradeOfferStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeftRight, Ban, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-4)}`;
}

export default function TradeOfferManagementPanel() {
  const { data: offers, isLoading, refetch } = useListAllTradeOffers();
  const cancelOffer = useCancelTradeOffer();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleCancel = async (offerId: string) => {
    try {
      await cancelOffer.mutateAsync(offerId);
      toast.success('Trade offer cancelled.');
      refetch();
    } catch {
      toast.error('Failed to cancel trade offer.');
    }
  };

  const sorted = [...(offers ?? [])].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'createdAt') {
      cmp = a.createdAt - b.createdAt;
    } else if (sortField === 'status') {
      cmp = a.status.localeCompare(b.status);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <ArrowLeftRight className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
        <p className="font-sans text-sm text-muted-foreground">No trade offers found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-sans text-xs">Offer ID</TableHead>
            <TableHead className="font-sans text-xs">Initiator</TableHead>
            <TableHead className="font-sans text-xs">Receiver</TableHead>
            <TableHead className="font-sans text-xs">Items</TableHead>
            <TableHead
              className="font-sans text-xs cursor-pointer select-none"
              onClick={() => toggleSort('status')}
            >
              <span className="flex items-center gap-1">
                Status
                <ArrowUpDown className="w-3 h-3" />
              </span>
            </TableHead>
            <TableHead
              className="font-sans text-xs cursor-pointer select-none"
              onClick={() => toggleSort('createdAt')}
            >
              <span className="flex items-center gap-1">
                Created
                <ArrowUpDown className="w-3 h-3" />
              </span>
            </TableHead>
            <TableHead className="font-sans text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((offer: TradeOffer) => (
            <TableRow key={offer.id}>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {offer.id.slice(0, 16)}…
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {truncatePrincipal(offer.initiatorId)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {truncatePrincipal(offer.receiverId)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-sans text-xs text-muted-foreground">
                  {offer.offeredItems.length} offered / {offer.requestedItems.length} requested
                </span>
              </TableCell>
              <TableCell>
                <TradeOfferStatusBadge status={offer.status} />
              </TableCell>
              <TableCell>
                <span className="font-sans text-xs text-muted-foreground">
                  {new Date(offer.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                {offer.status === 'pending' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/5 h-7 text-xs"
                        disabled={cancelOffer.isPending}
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Trade Offer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cancel this pending trade offer? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(offer.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Cancel Offer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
