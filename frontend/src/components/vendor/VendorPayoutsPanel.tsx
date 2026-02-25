import React from 'react';
import { useGetPayoutsForVendor } from '../../hooks/useQueries';
import PayoutStatusBadge from '../admin/PayoutStatusBadge';
import { PayoutStatus } from '../../backend';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

interface VendorPayoutsPanelProps {
  vendorId: string;
}

function formatAmount(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateId(id: string): string {
  if (id.length <= 20) return id;
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export default function VendorPayoutsPanel({ vendorId }: VendorPayoutsPanelProps) {
  const { data: payouts, isLoading, isError } = useGetPayoutsForVendor(vendorId);

  const sortedPayouts = [...(payouts ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  // Summary calculations
  const totalEarned = sortedPayouts
    .filter((p) => p.status === PayoutStatus.completed)
    .reduce((sum, p) => sum + p.netAmount, BigInt(0));

  const totalPending = sortedPayouts
    .filter(
      (p) => p.status === PayoutStatus.pending || p.status === PayoutStatus.processing
    )
    .reduce((sum, p) => sum + p.netAmount, BigInt(0));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        <Skeleton className="h-48 w-full rounded" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground font-sans text-sm">
        Failed to load payout data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-400" />
            </div>
            <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
              Total Earned
            </span>
          </div>
          <p className="font-serif text-2xl text-foreground">{formatAmount(totalEarned)}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">Completed payouts (net)</p>
        </div>

        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
              Pending Payouts
            </span>
          </div>
          <p className="font-serif text-2xl text-foreground">{formatAmount(totalPending)}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">Pending &amp; processing (net)</p>
        </div>
      </div>

      {/* Payouts Table */}
      {sortedPayouts.length === 0 ? (
        <div className="text-center py-10 border border-border rounded text-muted-foreground font-sans text-sm">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No payouts yet.</p>
          <p className="text-xs mt-1">Payouts are created when your orders are delivered.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Payout ID</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Order ID</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Gross</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Commission</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Net Payout</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayouts.map((payout) => (
                <TableRow key={payout.payoutId}>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[130px] truncate">
                    {truncateId(payout.payoutId)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[130px] truncate">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
