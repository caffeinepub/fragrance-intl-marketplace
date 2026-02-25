import React, { useState } from 'react';
import { useListAuctionsByVendor, useCancelAuction, type Auction } from '../../hooks/useQueries';
import AuctionStatusBadge from '../auctions/AuctionStatusBadge';
import AuctionCountdown from '../auctions/AuctionCountdown';
import CreateAuctionForm from './CreateAuctionForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Plus, Trophy, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

interface VendorAuctionsPanelProps {
  vendorId: string;
}

export default function VendorAuctionsPanel({ vendorId }: VendorAuctionsPanelProps) {
  const { data: auctions, isLoading, refetch } = useListAuctionsByVendor(vendorId);
  const cancelAuction = useCancelAuction();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCancel = async (auctionId: string) => {
    try {
      await cancelAuction.mutateAsync(auctionId);
      toast.success('Auction cancelled.');
      refetch();
    } catch {
      toast.error('Failed to cancel auction.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-muted-foreground">
          {auctions?.length ?? 0} auction{(auctions?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gold hover:bg-gold/90 text-background font-sans">
              <Plus className="w-4 h-4 mr-1" />
              Create Auction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create New Auction</DialogTitle>
            </DialogHeader>
            <CreateAuctionForm
              vendorId={vendorId}
              onSuccess={() => {
                setCreateOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!auctions || auctions.length === 0) ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Gavel className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
          <p className="font-sans text-sm text-muted-foreground">No auctions yet. Create your first auction!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map((auction: Auction) => {
            const isActive = auction.status === 'active' && Date.now() < auction.endTime;
            return (
              <div key={auction.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-background border border-border rounded">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to="/auctions/$auctionId"
                      params={{ auctionId: auction.id }}
                      className="font-sans text-sm font-medium text-foreground hover:text-gold transition-colors truncate"
                    >
                      {auction.productName}
                    </Link>
                    <AuctionStatusBadge status={isActive ? 'active' : auction.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Current: <span className="text-gold font-semibold">${auction.currentBid.toFixed(2)}</span></span>
                    <span>{auction.bidHistory.length} bid{auction.bidHistory.length !== 1 ? 's' : ''}</span>
                    {isActive ? (
                      <AuctionCountdown endTime={auction.endTime} compact />
                    ) : (
                      <span>Ended {new Date(auction.endTime).toLocaleDateString()}</span>
                    )}
                  </div>
                  {!isActive && auction.highestBidderId && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Trophy className="w-3 h-3" />
                      <span>Winner: <span className="font-mono">{auction.highestBidderId.slice(0, 12)}…</span></span>
                    </div>
                  )}
                </div>
                {isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0"
                        disabled={cancelAuction.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Auction?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently cancel the auction for "{auction.productName}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Auction</AlertDialogCancel>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
