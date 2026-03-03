import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Shield } from "lucide-react";
import React from "react";
import ApprovalDashboard from "../components/admin/ApprovalDashboard";
import AuctionManagementPanel from "../components/admin/AuctionManagementPanel";
import OrderManagementPanel from "../components/admin/OrderManagementPanel";
import PayoutManagementPanel from "../components/admin/PayoutManagementPanel";
import TradeOfferManagementPanel from "../components/admin/TradeOfferManagementPanel";
import { useIsCallerAdmin } from "../hooks/useQueries";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access the admin dashboard.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Manage users, orders, and platform settings
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <ApprovalDashboard />
        <OrderManagementPanel />
        <PayoutManagementPanel />
        <AuctionManagementPanel />
        <TradeOfferManagementPanel />
      </div>
    </div>
  );
}
