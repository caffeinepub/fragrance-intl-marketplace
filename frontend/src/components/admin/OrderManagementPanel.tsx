import React, { useState } from 'react';
import { useGetAllOrders, useUpdateOrderStatus } from '../../hooks/useQueries';
import { OrderStatus } from '../../types';
import { OrderStatusBadge } from '../orders/OrderStatusBadge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

const ALL_STATUSES = Object.values(OrderStatus);

export default function OrderManagementPanel() {
  const { data: orders, isLoading } = useGetAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = (orders ?? []).filter(
    (o) => statusFilter === 'all' || o.status === statusFilter,
  );

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateStatus.mutateAsync({ orderId, status });
    } finally {
      setUpdatingId(null);
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-gold" />
          <h3 className="font-serif text-lg text-foreground">All Orders</h3>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs font-sans border-border">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-sans text-sm">No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Order ID</TableHead>
                <TableHead className="font-sans text-xs">Customer</TableHead>
                <TableHead className="font-sans text-xs">Date</TableHead>
                <TableHead className="font-sans text-xs">Items</TableHead>
                <TableHead className="font-sans text-xs">Total</TableHead>
                <TableHead className="font-sans text-xs">Status</TableHead>
                <TableHead className="font-sans text-xs">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {typeof order.customer === 'string'
                      ? order.customer.slice(0, 8)
                      : String(order.customer).slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-sans text-sm">{order.items.length}</TableCell>
                  <TableCell className="font-sans text-sm">
                    ${(order.total / 100).toFixed(2)}
                  </TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                      disabled={updatingId === order.id}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs font-sans border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
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
