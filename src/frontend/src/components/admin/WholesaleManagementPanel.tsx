import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeCheck, Building2, Clock, Loader2, XCircle } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import type { WholesaleAccount } from "../../backend";
import {
  useApproveWholesaleAccount,
  useListWholesaleApplications,
  useRejectWholesaleAccount,
} from "../../hooks/useQueries";

function normalizeStatus(status: unknown): string {
  if (typeof status === "string") return status;
  if (status && typeof status === "object") {
    return Object.keys(status as object)[0] ?? "pending";
  }
  return "pending";
}

function StatusBadge({ status }: { status: unknown }) {
  const s = normalizeStatus(status);
  if (s === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-300 gap-1 text-xs">
        <BadgeCheck className="w-3 h-3" />
        Approved
      </Badge>
    );
  }
  if (s === "rejected") {
    return (
      <Badge className="bg-red-100 text-red-800 border border-red-300 gap-1 text-xs">
        <XCircle className="w-3 h-3" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 gap-1 text-xs">
      <Clock className="w-3 h-3" />
      Pending
    </Badge>
  );
}

export default function WholesaleManagementPanel() {
  const { data: accounts = [], isLoading } = useListWholesaleApplications();
  const approveMutation = useApproveWholesaleAccount();
  const rejectMutation = useRejectWholesaleAccount();

  const handleApprove = async (account: WholesaleAccount) => {
    try {
      await approveMutation.mutateAsync(account.applicant);
      toast.success(`${account.businessName} approved for wholesale access.`);
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve account.");
    }
  };

  const handleReject = async (account: WholesaleAccount) => {
    try {
      await rejectMutation.mutateAsync(account.applicant);
      toast.success(`${account.businessName} has been rejected.`);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject account.");
    }
  };

  if (isLoading) {
    return (
      <div data-ocid="admin.wholesale.loading_state" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div
        data-ocid="admin.wholesale.empty_state"
        className="text-center py-14 border border-dashed border-border rounded-xl"
      >
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-sans text-sm text-muted-foreground">
          No wholesale applications yet.
        </p>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.wholesale.table"
      className="rounded-lg border border-border overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-sans text-xs uppercase tracking-wider">
              Business
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider">
              Tax ID
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider">
              Applicant
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider">
              Applied
            </TableHead>
            <TableHead className="font-sans text-xs uppercase tracking-wider w-44">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account, idx) => {
            const statusStr = normalizeStatus(account.status);
            const position = idx + 1;
            const isProcessing =
              (approveMutation.isPending &&
                approveMutation.variables === account.applicant) ||
              (rejectMutation.isPending &&
                rejectMutation.variables === account.applicant);

            return (
              <TableRow
                key={account.id}
                data-ocid={`admin.wholesale.row.${position}`}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {account.businessName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {account.taxId || "—"}
                </TableCell>
                <TableCell>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-32">
                    {account.applicant
                      ? `${account.applicant.toString().slice(0, 12)}…`
                      : "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={account.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(Number(account.createdAt)).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {statusStr !== "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid={`admin.wholesale.confirm_button.${position}`}
                        onClick={() => handleApprove(account)}
                        disabled={isProcessing}
                        className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50 gap-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-3 h-3" />
                        )}
                        Approve
                      </Button>
                    )}
                    {statusStr !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid={`admin.wholesale.delete_button.${position}`}
                        onClick={() => handleReject(account)}
                        disabled={isProcessing}
                        className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        Reject
                      </Button>
                    )}
                    {statusStr === "approved" && (
                      <span className="text-xs text-green-700 font-medium">
                        Active
                      </span>
                    )}
                    {statusStr === "rejected" && (
                      <span className="text-xs text-muted-foreground">
                        Closed
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
