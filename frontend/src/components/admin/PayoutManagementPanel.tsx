import React, { useState } from 'react';
import {
  useGetAllPayouts,
  useUpdatePayoutStatus,
  useGetCommissionRate,
  useSetCommissionRate,
} from '../../hooks/useQueries';
import PayoutStatusBadge from './PayoutStatusBadge';
import { PayoutStatus } from '../../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const ALL_PAYOUT_STATUSES = [
  PayoutStatus.pending,
  PayoutStatus.processing,
  PayoutStatus.completed,
  PayoutStatus.failed,
];

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  [PayoutStatus.pending]: 'Pending',
  [PayoutStatus.processing]: 'Processing',
  [PayoutStatus.completed]: 'Completed',
  [PayoutStatus.failed]: 'Failed',
};

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatAmount(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function truncateId(id: string): string {
  if (id.length <= 20) return id;
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export default function PayoutManagementPanel() {
  const { data: payouts, isLoading: payoutsLoading, refetch, isFetching } = useGetAllPayouts();
  const { data: commissionRate, isLoading: rateLoading } = useGetCommissionRate();
  const updatePayoutStatus = useUpdatePayoutStatus();
  const setCommissionRate = useSetCommissionRate();

  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState<string>('');
  const [isSavingRate, setIsSavingRate] = useState(false);

  // Sync rateInput when commissionRate loads
  React.useEffect(() => {
    if (commissionRate !== undefined && rateInput === '') {
      setRateInput(commissionRate.toString());
    }
  }, [commissionRate]);

  const sortedPayouts = [...(payouts ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  const handleStatusChange = async (payoutId: string, newStatus: PayoutStatus) => {
    setUpdatingPayoutId(payoutId);
    try {
      await updatePayoutStatus.mutateAsync({ payoutId, status: newStatus });
      toast.success(`Payout status updated to ${PAYOUT_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update payout status';
      toast.error(msg);
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  const handleSaveRate = async () => {
    const parsed = parseInt(rateInput, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('Commission rate must be a whole number between 0 and 100');
      return;
    }
    setIsSavingRate(true);
    try {
      await setCommissionRate.mutateAsync(BigInt(parsed));
      toast.success(`Commission rate updated to ${parsed}%`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update commission rate';
      toast.error(msg);
    } finally {
      setIsSavingRate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Commission Rate Editor */}
      <div className="bg-muted/30 border border-border rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <Percent className="w-4 h-4 text-gold" />
          <h3 className="font-sans text-sm font-semibold text-foreground uppercase tracking-wider">
            Platform Commission Rate
          </h3>
        </div>
        {rateLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="commission-rate" className="font-sans text-xs text-muted-foreground">
                Rate (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission-rate"
                  type="number"
                  min={0}
                  max={100}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-24 h-9 text-sm font-mono"
                  placeholder="0–100"
                />
                <span className="font-sans text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSaveRate}
              disabled={isSavingRate}
              className="h-9 bg-gold hover:bg-gold/90 text-background font-sans text-xs"
            >
              {isSavingRate ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Rate'
              )}
            </Button>
            {commissionRate !== undefined && (
              <p className="font-sans text-xs text-muted-foreground self-end pb-1">
                Current rate: <span className="font-semibold text-foreground">{commissionRate.toString()}%</span>
              </p>
            )}
          </div>
        )}
        <p className="font-sans text-xs text-muted-foreground mt-2">
          Changing the rate only affects new payouts. Existing payout records are not modified.
        </p>
      </div>

      {/* Payouts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-sans text-sm font-semibold text-foreground">All Payouts</span>
            <Badge variant="secondary" className="text-xs">
              {sortedPayouts.length} payout{sortedPayouts.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs"
          >
            {isFetching ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Refresh
          </Button>
        </div>

        {payoutsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : sortedPayouts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground font-sans text-sm border border-border rounded">
            No payouts found. Payouts are created automatically when orders are marked as delivered.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Payout ID</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Vendor</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Gross</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Commission</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Net</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayouts.map((payout) => {
                  const isUpdating = updatingPayoutId === payout.payoutId;
                  const isTerminal =
                    payout.status === PayoutStatus.completed ||
                    payout.status === PayoutStatus.failed;
                  return (
                    <TableRow key={payout.payoutId} className={isUpdating ? 'opacity-60' : ''}>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[130px] truncate">
                        {truncateId(payout.payoutId)}
                      </TableCell>
                      <TableCell className="font-sans text-xs text-foreground max-w-[120px] truncate">
                        {payout.vendorId}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {truncateId(payout.orderId)}
                      </TableCell>
                      <TableCell className="font-serif text-sm text-right whitespace-nowrap">
                        {formatAmount(payout.grossAmount)}
                      </TableCell>
                      <TableCell className="font-serif text-sm text-right whitespace-nowrap text-destructive">
                        -{formatAmount(payout.commissionAmount)}
                      </TableCell>
                      <TableCell className="font-serif text-sm text-right whitespace-nowrap text-gold font-semibold">
                        {formatAmount(payout.netAmount)}
                      </TableCell>
                      <TableCell>
                        <PayoutStatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell className="font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(payout.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={payout.status}
                          onValueChange={(v) =>
                            handleStatusChange(payout.payoutId, v as PayoutStatus)
                          }
                          disabled={isUpdating || isTerminal}
                        >
                          <SelectTrigger className="w-36 h-7 text-xs">
                            {isUpdating ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Updating…
                              </span>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_PAYOUT_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {PAYOUT_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
