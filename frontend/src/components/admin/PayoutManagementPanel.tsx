import React, { useState } from 'react';
import { useGetAllPayouts, useUpdatePayoutStatus, useGetCommissionRate, useSetCommissionRate } from '../../hooks/useQueries';
import type { LocalPayout } from '../../hooks/useQueries';
import PayoutStatusBadge from './PayoutStatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PayoutManagementPanel() {
  const { data: payouts = [], isLoading } = useGetAllPayouts();
  const updateStatus = useUpdatePayoutStatus();
  const { data: commissionRate = 5 } = useGetCommissionRate();
  const setCommissionRate = useSetCommissionRate();
  const [rateInput, setRateInput] = useState<string>('');

  const handleSaveRate = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setCommissionRate.mutate(parsed);
      setRateInput('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commission Rate Editor */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Commission Rate</p>
          <p className="text-xs text-muted-foreground">Current: {commissionRate}%</p>
        </div>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          placeholder={String(commissionRate)}
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          className="w-24"
        />
        <Button size="sm" onClick={handleSaveRate} disabled={setCommissionRate.isPending}>
          Save
        </Button>
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No payouts found.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout: LocalPayout) => (
                <TableRow key={payout.payoutId}>
                  <TableCell className="font-mono text-xs">{payout.payoutId.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs">{String(payout.vendorId).slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs">{payout.orderId.slice(0, 10)}…</TableCell>
                  <TableCell>{formatPrice(payout.grossAmount)}</TableCell>
                  <TableCell>{formatPrice(payout.commissionAmount)}</TableCell>
                  <TableCell>{formatPrice(payout.netAmount)}</TableCell>
                  <TableCell>
                    <PayoutStatusBadge status={payout.status} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={payout.status}
                      onValueChange={(val) =>
                        updateStatus.mutate({ payoutId: payout.payoutId, status: val })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYOUT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
