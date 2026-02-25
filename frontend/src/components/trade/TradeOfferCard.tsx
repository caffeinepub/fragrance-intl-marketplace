import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeftRight, Check, X, RefreshCw, Ban, DollarSign, MessageSquare } from 'lucide-react';
import TradeOfferStatusBadge from './TradeOfferStatusBadge';
import CounterOfferForm from './CounterOfferForm';
import { useAcceptTradeOffer, useRejectTradeOffer, useCancelTradeOffer, type TradeOffer } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface TradeOfferCardProps {
  offer: TradeOffer;
  currentUserId: string;
  onAction?: () => void;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-4)}`;
}

export default function TradeOfferCard({ offer, currentUserId, onAction }: TradeOfferCardProps) {
  const acceptOffer = useAcceptTradeOffer();
  const rejectOffer = useRejectTradeOffer();
  const cancelOffer = useCancelTradeOffer();
  const [counterOpen, setCounterOpen] = useState(false);

  const isInitiator = offer.initiatorId === currentUserId;
  const isReceiver = offer.receiverId === currentUserId;
  const isPending = offer.status === 'pending';

  const handleAccept = async () => {
    try {
      await acceptOffer.mutateAsync(offer.id);
      toast.success('Trade offer accepted!');
      onAction?.();
    } catch {
      toast.error('Failed to accept offer.');
    }
  };

  const handleReject = async () => {
    try {
      await rejectOffer.mutateAsync(offer.id);
      toast.success('Trade offer rejected.');
      onAction?.();
    } catch {
      toast.error('Failed to reject offer.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOffer.mutateAsync(offer.id);
      toast.success('Trade offer cancelled.');
      onAction?.();
    } catch {
      toast.error('Failed to cancel offer.');
    }
  };

  return (
    <Card className="border border-border hover:border-gold/30 transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight className="w-4 h-4 text-gold" />
              {/* Use font-mono only (removed conflicting font-sans) */}
              <span className="font-mono text-xs text-muted-foreground">
                {offer.id.slice(0, 16)}…
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-sans">
              <span>From: <span className="font-mono">{truncatePrincipal(offer.initiatorId)}</span></span>
              <span>→</span>
              <span>To: <span className="font-mono">{truncatePrincipal(offer.receiverId)}</span></span>
            </div>
          </div>
          <TradeOfferStatusBadge status={offer.status} />
        </div>

        {offer.parentOfferId && (
          <p className="font-sans text-xs text-amber-600 dark:text-amber-400">
            Counter offer to: <span className="font-mono">{offer.parentOfferId.slice(0, 16)}…</span>
          </p>
        )}

        <Separator />

        {/* Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-2">Offered</p>
            <ul className="space-y-1">
              {offer.offeredItems.map((item, i) => (
                <li key={i} className="font-sans text-sm text-foreground flex justify-between">
                  <span>{item.productName}</span>
                  <span className="text-muted-foreground">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-2">Requested</p>
            <ul className="space-y-1">
              {offer.requestedItems.map((item, i) => (
                <li key={i} className="font-sans text-sm text-foreground flex justify-between">
                  <span>{item.productName}</span>
                  <span className="text-muted-foreground">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cash Adjustment */}
        {offer.cashAdjustment !== 0 && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-sans text-muted-foreground">Cash adjustment:</span>
            <span className={`font-mono font-semibold ${offer.cashAdjustment > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {offer.cashAdjustment > 0 ? '+' : ''}${offer.cashAdjustment}
            </span>
          </div>
        )}

        {/* Note */}
        {offer.note && (
          <div className="flex items-start gap-2 bg-muted/30 rounded p-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="font-sans text-sm text-muted-foreground">{offer.note}</p>
          </div>
        )}

        {/* Timestamp */}
        <p className="font-sans text-xs text-muted-foreground">
          Created {new Date(offer.createdAt).toLocaleDateString()} at {new Date(offer.createdAt).toLocaleTimeString()}
        </p>

        {/* Actions */}
        {isPending && (
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Receiver actions */}
            {isReceiver && (
              <>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={acceptOffer.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans"
                >
                  {acceptOffer.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check className="w-3.5 h-3.5 mr-1" />Accept</>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-sans"
                      disabled={rejectOffer.isPending}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Trade Offer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reject the trade offer. The initiator will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {/* Initiator cancel */}
            {isInitiator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-sans"
                    disabled={cancelOffer.isPending}
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Trade Offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your trade offer. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
                      Cancel Offer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Counter offer (both parties) */}
            <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gold/30 text-bronze hover:bg-gold/5 font-sans"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Counter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Counter Offer</DialogTitle>
                </DialogHeader>
                <CounterOfferForm
                  originalOffer={offer}
                  currentUserId={currentUserId}
                  onSuccess={() => {
                    setCounterOpen(false);
                    onAction?.();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
