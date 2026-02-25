import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerApproved, useGetCallerUserProfile } from '../hooks/useQueries';
import AccessDenied from '../components/common/AccessDenied';
import VendorProfileEditor from '../components/vendor/VendorProfileEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Store, Package, ArrowRight } from 'lucide-react';
import { useGetVendorProfile } from '../hooks/useQueries';
import { useInternetIdentity as useII } from '../hooks/useInternetIdentity';

function VendorDashboardContent() {
  const { identity } = useII();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  // Derive vendor ID from principal (same logic as registration: lowercase principal)
  const principalStr = identity?.getPrincipal().toString() || '';
  // Try to find vendor profile by looking up a stored vendorId
  // Since we don't have a "get my vendor profile" endpoint, we use the store ID the user created
  // We'll use a localStorage hint or fall back to showing a message
  const storedVendorId = typeof window !== 'undefined'
    ? localStorage.getItem(`vendorId_${principalStr}`)
    : null;

  const { data: vendorProfile, isLoading: vendorLoading } = useGetVendorProfile(storedVendorId);

  if (profileLoading || vendorLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendorProfile) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="font-serif text-xl text-foreground mb-2">No Store Found</h3>
        <p className="text-muted-foreground font-sans mb-4 text-sm">
          We couldn't find your store profile. Please register as a vendor first.
        </p>
        <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
          <Link to="/vendor/register">Register Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-gold" />
            <span className="font-sans text-sm text-muted-foreground">Store Status</span>
          </div>
          <p className="font-serif text-xl text-foreground">
            {vendorProfile.approved ? 'Active' : 'Pending Approval'}
          </p>
        </div>
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-gold" />
            <span className="font-sans text-sm text-muted-foreground">Products</span>
          </div>
          <Button asChild variant="ghost" className="p-0 h-auto font-serif text-xl text-foreground hover:text-gold">
            <Link to="/vendor/products">
              Manage Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Editor */}
      <div className="bg-card border border-border rounded p-6">
        <h2 className="font-serif text-xl text-foreground mb-5">Store Profile</h2>
        <VendorProfileEditor profile={vendorProfile} />
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const { identity } = useInternetIdentity();
  const { data: isApproved, isLoading } = useIsCallerApproved();

  if (!identity) {
    return <AccessDenied message="Please sign in to access your vendor dashboard." />;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!isApproved) {
    return (
      <AccessDenied
        message="Your vendor account is pending approval. Please wait for an admin to review your application."
        showHomeLink
      />
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Vendor</p>
        <h1 className="font-serif text-3xl text-foreground">My Store Dashboard</h1>
      </div>
      <VendorDashboardContent />
    </main>
  );
}
