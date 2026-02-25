import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import AccessDenied from '../components/common/AccessDenied';
import ApprovalDashboard from '../components/admin/ApprovalDashboard';
import RoleAssignmentForm from '../components/admin/RoleAssignmentForm';
import OrderManagementPanel from '../components/admin/OrderManagementPanel';
import PayoutManagementPanel from '../components/admin/PayoutManagementPanel';
import AuctionManagementPanel from '../components/admin/AuctionManagementPanel';
import TradeOfferManagementPanel from '../components/admin/TradeOfferManagementPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (!identity) {
    return <AccessDenied message="Please sign in to access the admin dashboard." />;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDenied message="You do not have admin privileges to access this dashboard." />
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold" />
        </div>
        <div>
          <p className="font-sans text-xs text-gold uppercase tracking-[0.2em]">Administration</p>
          <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Vendor Approvals */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">Vendor Approval Requests</h2>
          <ApprovalDashboard />
        </div>

        <Separator />

        {/* Role Assignment */}
        <div className="bg-card border border-border rounded p-6">
          <RoleAssignmentForm />
        </div>

        <Separator />

        {/* Order Management */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">Order Management</h2>
          <OrderManagementPanel />
        </div>

        <Separator />

        {/* Payout Management */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">Payout Management</h2>
          <PayoutManagementPanel />
        </div>

        <Separator />

        {/* Auction Management */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">Auction Management</h2>
          <AuctionManagementPanel />
        </div>

        <Separator />

        {/* Trade Offer Management */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">Trade Offer Management</h2>
          <TradeOfferManagementPanel />
        </div>
      </div>
    </main>
  );
}
