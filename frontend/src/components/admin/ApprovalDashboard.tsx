import React from 'react';
import { useListApprovals, useSetApproval } from '../../hooks/useQueries';
import { ApprovalStatus } from '../../backend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@icp-sdk/core/principal';

const statusConfig = {
  [ApprovalStatus.pending]: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  [ApprovalStatus.approved]: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  [ApprovalStatus.rejected]: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
};

export default function ApprovalDashboard() {
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();

  const handleApprove = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success('User approved');
    } catch {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success('User rejected');
    } catch {
      toast.error('Failed to reject user');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-sans">No approval requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((item) => {
        const config = statusConfig[item.status];
        const Icon = config.icon;
        const principalStr = item.principal.toString();

        return (
          <div
            key={principalStr}
            className="flex items-center justify-between p-4 rounded border border-border bg-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-xs text-foreground truncate max-w-[200px] sm:max-w-xs">
                  {principalStr}
                </p>
                <Badge variant={config.variant} className="mt-1 text-xs">
                  {config.label}
                </Badge>
              </div>
            </div>

            {item.status === ApprovalStatus.pending && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(item.principal)}
                  disabled={setApproval.isPending}
                  className="border-green-500/40 text-green-700 hover:bg-green-50 text-xs"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(item.principal)}
                  disabled={setApproval.isPending}
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 text-xs"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
