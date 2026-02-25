import React, { useState } from 'react';
import { useVendorTransactions } from '../../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, Receipt, PackageSearch } from 'lucide-react';
import type { TransactionEntry } from '../../backend';

type SortDir = 'desc' | 'asc';

function formatPrice(amount: bigint): string {
  return `$${(Number(amount) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function shortId(id: string): string {
  return id.length > 18 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id;
}

export default function VendorOrderHistory() {
  const { data: transactions, isLoading, isError } = useVendorTransactions();
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = React.useMemo<TransactionEntry[]>(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      const diff = Number(a.timestamp) - Number(b.timestamp);
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [transactions, sortDir]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="font-sans text-sm text-destructive py-4">
        Failed to load order history. Please try again.
      </p>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <PackageSearch className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
        <p className="font-serif text-lg text-foreground mb-1">No orders yet</p>
        <p className="font-sans text-sm text-muted-foreground">
          Orders containing your products will appear here once customers complete purchases.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              Order ID
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              <button
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Date
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              Items
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground text-right">
              Gross
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground text-right">
              Commission
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground text-right">
              Net Payout
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground text-right">
              Receipt
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((tx) => (
            <TableRow key={tx.orderId} className="border-border hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs text-muted-foreground">
                {shortId(tx.orderId)}
              </TableCell>
              <TableCell className="font-sans text-sm text-foreground whitespace-nowrap">
                {formatDate(tx.timestamp)}
              </TableCell>
              <TableCell className="font-sans text-sm text-muted-foreground">
                {tx.items.length} item{tx.items.length !== 1 ? 's' : ''}
              </TableCell>
              <TableCell className="font-sans text-sm text-foreground text-right">
                {formatPrice(tx.totalAmount)}
              </TableCell>
              <TableCell className="font-sans text-sm text-destructive text-right">
                −{formatPrice(tx.commissionFee)}
              </TableCell>
              <TableCell className="font-sans text-sm font-medium text-gold text-right">
                {formatPrice(tx.netPayout)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-bronze"
                >
                  <Link to="/order/$orderId/receipt" params={{ orderId: tx.orderId }}>
                    <Receipt className="w-3 h-3 mr-1" />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
