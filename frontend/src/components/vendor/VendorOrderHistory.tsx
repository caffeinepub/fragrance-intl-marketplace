import React, { useState } from 'react';
import { useVendorTransactions } from '../../hooks/useQueries';
import type { VendorTransaction } from '../../hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Receipt } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export default function VendorOrderHistory() {
  const { data: transactions, isLoading } = useVendorTransactions();
  const [sortAsc, setSortAsc] = useState(false);
  const navigate = useNavigate();

  const sorted = [...(transactions ?? [])].sort((a: VendorTransaction, b: VendorTransaction) => {
    const diff = a.timestamp - b.timestamp;
    return sortAsc ? diff : -diff;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground font-sans text-sm">
        No order history yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-sans text-xs">Order ID</TableHead>
            <TableHead
              className="font-sans text-xs cursor-pointer select-none"
              onClick={() => setSortAsc((v) => !v)}
            >
              <span className="flex items-center gap-1">
                Date <ArrowUpDown className="w-3 h-3" />
              </span>
            </TableHead>
            <TableHead className="font-sans text-xs">Items</TableHead>
            <TableHead className="font-sans text-xs">Gross</TableHead>
            <TableHead className="font-sans text-xs">Commission</TableHead>
            <TableHead className="font-sans text-xs">Net Payout</TableHead>
            <TableHead className="font-sans text-xs"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((tx: VendorTransaction) => (
            <TableRow key={tx.orderId}>
              <TableCell className="font-mono text-xs">{tx.orderId.slice(0, 10)}…</TableCell>
              <TableCell className="font-sans text-xs text-muted-foreground">
                {formatDate(tx.timestamp)}
              </TableCell>
              <TableCell className="font-sans text-sm">{tx.items.length}</TableCell>
              <TableCell className="font-sans text-sm">{formatPrice(tx.totalAmount)}</TableCell>
              <TableCell className="font-sans text-sm text-muted-foreground">
                -{formatPrice(tx.commissionFee)}
              </TableCell>
              <TableCell className="font-sans text-sm font-medium text-gold">
                {formatPrice(tx.netPayout)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    navigate({
                      to: '/orders/$orderId/receipt',
                      params: { orderId: tx.orderId },
                    })
                  }
                >
                  <Receipt className="w-3 h-3 mr-1" />
                  Receipt
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
