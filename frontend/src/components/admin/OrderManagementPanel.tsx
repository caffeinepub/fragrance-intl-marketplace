import React, { useState } from 'react';
import { useGetAllOrders, useUpdateOrderStatus } from '../../hooks/useQueries';
import OrderStatusBadge from '../orders/OrderStatusBadge';
import { OrderStatus } from '../../backend';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

const ALL_STATUSES = [
  OrderStatus.pending,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.canceled,
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.pending]: 'Pending',
  [OrderStatus.processing]: 'Processing',
  [OrderStatus.shipped]: 'Shipped',
  [OrderStatus.delivered]: 'Delivered',
  [OrderStatus.canceled]: 'Canceled',
};

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-6)}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function OrderManagementPanel() {
  const { data: orders, isLoading, refetch, isFetching } = useGetAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const filteredOrders = (orders ?? []).filter((o) =>
    filterStatus === 'all' ? true : o.status === filterStatus
  );

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-xs">
            {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''}
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

      {sortedOrders.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground font-sans text-sm">
          No orders found{filterStatus !== 'all' ? ` with status "${STATUS_LABELS[filterStatus as OrderStatus]}"` : ''}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Order ID</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Customer</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Items</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Total</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider">Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                return (
                  <TableRow key={order.id} className={isUpdating ? 'opacity-60' : ''}>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {order.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {truncatePrincipal(order.customer.toString())}
                    </TableCell>
                    <TableCell className="font-sans text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-sans text-xs text-center">
                      {order.items.length}
                    </TableCell>
                    <TableCell className="font-serif text-sm text-gold whitespace-nowrap">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                          disabled={isUpdating || order.status === OrderStatus.delivered || order.status === OrderStatus.canceled}
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
                            {ALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
