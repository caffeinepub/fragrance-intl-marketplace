import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Building2, Shield } from "lucide-react";
import React from "react";
import ApprovalDashboard from "../components/admin/ApprovalDashboard";
import AuctionManagementPanel from "../components/admin/AuctionManagementPanel";
import OrderManagementPanel from "../components/admin/OrderManagementPanel";
import PayoutManagementPanel from "../components/admin/PayoutManagementPanel";
import TradeOfferManagementPanel from "../components/admin/TradeOfferManagementPanel";
import WholesaleManagementPanel from "../components/admin/WholesaleManagementPanel";
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

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="approvals" className="text-sm">
            Approvals
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-sm">
            Orders
          </TabsTrigger>
          <TabsTrigger value="payouts" className="text-sm">
            Payouts
          </TabsTrigger>
          <TabsTrigger value="auctions" className="text-sm">
            Auctions
          </TabsTrigger>
          <TabsTrigger value="trade" className="text-sm">
            Trade Offers
          </TabsTrigger>
          <TabsTrigger
            value="wholesale"
            data-ocid="admin.wholesale_accounts_table"
            className="text-sm gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Wholesale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <ApprovalDashboard />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagementPanel />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutManagementPanel />
        </TabsContent>

        <TabsContent value="auctions">
          <AuctionManagementPanel />
        </TabsContent>

        <TabsContent value="trade">
          <TradeOfferManagementPanel />
        </TabsContent>

        <TabsContent value="wholesale">
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl text-foreground">
                Wholesale Applications
              </h2>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                Review and manage wholesale account applications from businesses
                seeking bulk pricing access.
              </p>
            </div>
            <WholesaleManagementPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
