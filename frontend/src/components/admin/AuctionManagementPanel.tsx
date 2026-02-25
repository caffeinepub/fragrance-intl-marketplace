import React from 'react';
import { useListAllAuctions, useCancelAuction, useFinalizeAuction, type Auction } from '../../hooks/useQueries';
import AuctionStatusBadge from '../auctions/AuctionStatusBadge';
import AuctionCountdown from '../auctions/AuctionCountdown';
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
import { XCircle, CheckCircle2, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

export default function AuctionManagementPanel() {
  const { data: auctions, isLoading, refetch } = useListAllAuctions();
  const cancelAuction = useCancelAuction();
  const finalizeAuction = useFinalizeAuction();

  const handleCancel = async (auctionId: string) => {
    try {
      await cancelAuction.mutateAsync(auctionId);
      toast.success('Auction cancelled.');
      refetch();
    } catch {
      toast.error('Failed to cancel auction.');
    }
  };

  const handleFinalize = async (auctionId: string) => {
    try {
      await finalizeAuction.mutateAsync(auctionId);
      toast.success('Auction finalized.');
      refetch();
    } catch {
      toast.error('Failed to finalize auction.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!auctions || auctions.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Gavel className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
        <p className="font-sans text-sm text-muted-foreground">No auctions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-sans text-xs">Product</TableHead>
            <TableHead className="font-sans text-xs">Vendor</TableHead>
            <TableHead className="font-sans text-xs">Current Bid</TableHead>
            <TableHead className="font-sans text-xs">End Time</TableHead>
            <TableHead className="font-sans text-xs">Status</TableHead>
            <TableHead className="font-sans text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction: Auction) => {
            const isActive = auction.status === 'active' && Date.now() < auction.endTime;
            const isEndedUnfinalized = auction.status === 'active' && Date.now() >= auction.endTime;
            return (
              <TableRow key={auction.id}>
                <TableCell>
                  <Link
                    to="/auctions/$auctionId"
                    params={{ auctionId: auction.id }}
                    className="font-sans text-sm text-foreground hover:text-gold transition-colors"
                  >
                    {auction.productName}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{auction.id.slice(0, 16)}…</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {auction.vendorId.slice(0, 12)}…
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-serif text-sm font-semibold text-gold">
                    ${auction.currentBid.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  {isActive ? (
                    <AuctionCountdown endTime={auction.endTime} compact />
                  ) : (
                    <span className="font-sans text-xs text-muted-foreground">
                      {new Date(auction.endTime).toLocaleDateString()}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <AuctionStatusBadge status={isEndedUnfinalized ? 'ended' : auction.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/5 h-7 text-xs"
                            disabled={cancelAuction.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Auction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cancel the auction for "{auction.productName}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(auction.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Cancel Auction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {isEndedUnfinalized && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-7 text-xs"
                        onClick={() => handleFinalize(auction.id)}
                        disabled={finalizeAuction.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Finalize
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
