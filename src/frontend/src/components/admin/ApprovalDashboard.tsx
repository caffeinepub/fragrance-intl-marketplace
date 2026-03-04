import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { CheckCircle, Clock, Loader2, Users, XCircle } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
// ApprovalStatus is not exported from backend.d.ts — define locally
enum ApprovalStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
}
import { useListApprovals, useSetApproval } from "../../hooks/useQueries";

const statusConfig = {
  [ApprovalStatus.pending]: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
  },
  [ApprovalStatus.approved]: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle,
  },
  [ApprovalStatus.rejected]: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export default function ApprovalDashboard() {
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();
  // Track which principal is currently being processed
  const [processingPrincipal, setProcessingPrincipal] = useState<string | null>(
    null,
  );

  const handleApprove = async (principal: Principal) => {
    const principalStr = principal.toString();
    setProcessingPrincipal(principalStr);
    try {
      await setApproval.mutateAsync({
        user: principal,
        status: ApprovalStatus.approved,
      });
      toast.success("Vendor approved successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to approve vendor: ${message}`);
    } finally {
      setProcessingPrincipal(null);
    }
  };

  const handleReject = async (principal: Principal) => {
    const principalStr = principal.toString();
    setProcessingPrincipal(principalStr);
    try {
      await setApproval.mutateAsync({
        user: principal,
        status: ApprovalStatus.rejected,
      });
      toast.success("Vendor rejected successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to reject vendor: ${message}`);
    } finally {
      setProcessingPrincipal(null);
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
        const isProcessing = processingPrincipal === principalStr;

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
                  disabled={isProcessing}
                  className="border-green-500/40 text-green-700 hover:bg-green-50 text-xs min-w-[80px]"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(item.principal)}
                  disabled={isProcessing}
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 text-xs min-w-[80px]"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Reject"
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
