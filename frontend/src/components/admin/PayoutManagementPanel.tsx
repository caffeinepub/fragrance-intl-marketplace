import React, { useState } from 'react';
import {
  useGetAllPayouts,
  useUpdatePayoutStatus,
  useGetCommissionRate,
  useSetCommissionRate,
} from '../../hooks/useQueries';
import { PayoutStatus } from '../../types';
import { PayoutStatusBadge } from './PayoutStatusBadge';
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
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2 } from 'lucide-react';

const ALL_PAYOUT_STATUSES = Object.values(PayoutStatus);

export default function PayoutManagementPanel() {
  const { data: payouts, isLoading } = useGetAllPayouts();
  const updateStatus = useUpdatePayoutStatus();
  const { data: commissionRate } = useGetCommissionRate();
  const setCommissionRate = useSetCommissionRate();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const handleStatusChange = async (payoutId: string, status: PayoutStatus) => {
    setUpdatingId(payoutId);
    try {
      await updateStatus.mutateAsync({ payoutId, status });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveRate = async () => {
    const rate = parseInt(rateInput, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    setSavingRate(true);
    try {
      await setCommissionRate.mutateAsync(BigInt(rate));
      setRateInput('');
    } finally {
      setSavingRate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commission Rate Editor */}
      <div className="bg-card border border-border rounded p-4 flex items-center gap-4 flex-wrap">
        <DollarSign className="w-5 h-5 text-gold shrink-0" />
        <div>
          <p className="font-sans text-sm text-foreground font-medium">Commission Rate</p>
          <p className="font-sans text-xs text-muted-foreground">
            Current: {commissionRate != null ? `${commissionRate}%` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="number"
            min={0}
            max={100}
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            placeholder="New rate %"
            className="w-28 h-8 text-xs font-sans border-border"
          />
          <Button
            size="sm"
            onClick={handleSaveRate}
            disabled={savingRate || !rateInput}
            className="h-8 font-sans text-xs bg-gold text-background hover:bg-gold/90"
          >
            {savingRate && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-lg text-foreground">All Payouts</h3>
        <Badge variant="secondary" className="ml-auto">{(payouts ?? []).length}</Badge>
      </div>

      {(payouts ?? []).length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-sans text-sm">No payouts found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Payout ID</TableHead>
                <TableHead className="font-sans text-xs">Vendor</TableHead>
                <TableHead className="font-sans text-xs">Order ID</TableHead>
                <TableHead className="font-sans text-xs">Gross</TableHead>
                <TableHead className="font-sans text-xs">Commission</TableHead>
                <TableHead className="font-sans text-xs">Net</TableHead>
                <TableHead className="font-sans text-xs">Status</TableHead>
                <TableHead className="font-sans text-xs">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts ?? []).map((payout) => (
                <TableRow key={payout.payoutId}>
                  <TableCell className="font-mono text-xs">{payout.payoutId.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payout.vendorId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payout.orderId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-sans text-sm">
                    ${(payout.grossAmount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-sans text-sm text-muted-foreground">
                    ${(payout.commissionAmount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-sans text-sm font-medium">
                    ${(payout.netAmount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell><PayoutStatusBadge status={payout.status} /></TableCell>
                  <TableCell>
                    <Select
                      value={payout.status}
                      onValueChange={(v) => handleStatusChange(payout.payoutId, v as PayoutStatus)}
                      disabled={updatingId === payout.payoutId}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs font-sans border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_PAYOUT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
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
