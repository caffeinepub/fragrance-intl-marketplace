import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import React from "react";
import { useGetVendorPayouts } from "../../hooks/useQueries";
import type { LocalPayout } from "../../hooks/useQueries";
import PayoutStatusBadge from "../admin/PayoutStatusBadge";

interface VendorPayoutsPanelProps {
  vendorId: string;
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export default function VendorPayoutsPanel({
  vendorId: _vendorId,
}: VendorPayoutsPanelProps) {
  const { data: payouts, isLoading } = useGetVendorPayouts();

  const totalEarned = (payouts ?? [])
    .filter((p: LocalPayout) => p.status === "completed")
    .reduce((sum: number, p: LocalPayout) => sum + p.netAmount, 0);

  const totalPending = (payouts ?? [])
    .filter(
      (p: LocalPayout) => p.status === "pending" || p.status === "processing",
    )
    .reduce((sum: number, p: LocalPayout) => sum + p.netAmount, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-sans text-xs text-muted-foreground">
              Total Earned
            </p>
            <p className="font-serif text-lg text-foreground">
              {formatAmount(totalEarned)}
            </p>
          </div>
        </div>
        <div className="bg-background border border-border rounded p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-sans text-xs text-muted-foreground">Pending</p>
            <p className="font-serif text-lg text-foreground">
              {formatAmount(totalPending)}
            </p>
          </div>
        </div>
      </div>

      {!payouts || payouts.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="font-sans text-sm text-muted-foreground">
            No payouts yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Payout ID</TableHead>
                <TableHead className="font-sans text-xs">Order ID</TableHead>
                <TableHead className="font-sans text-xs">Date</TableHead>
                <TableHead className="font-sans text-xs">Gross</TableHead>
                <TableHead className="font-sans text-xs">Commission</TableHead>
                <TableHead className="font-sans text-xs">Net</TableHead>
                <TableHead className="font-sans text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts ?? []).map((payout: LocalPayout) => (
                <TableRow key={payout.payoutId}>
                  <TableCell className="font-mono text-xs">
                    {payout.payoutId.slice(0, 10)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payout.orderId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">
                    {formatDate(payout.createdAt)}
                  </TableCell>
                  <TableCell className="font-sans text-sm">
                    {formatAmount(payout.grossAmount)}
                  </TableCell>
                  <TableCell className="font-sans text-sm text-muted-foreground">
                    -{formatAmount(payout.commissionAmount)}
                  </TableCell>
                  <TableCell className="font-sans text-sm font-medium">
                    {formatAmount(payout.netAmount)}
                  </TableCell>
                  <TableCell>
                    <PayoutStatusBadge
                      status={
                        payout.status as
                          | "pending"
                          | "processing"
                          | "completed"
                          | "failed"
                      }
                    />
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
