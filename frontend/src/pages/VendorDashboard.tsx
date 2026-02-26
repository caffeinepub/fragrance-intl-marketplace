import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerApproved, useGetCallerUserProfile, useMyStores } from '../hooks/useQueries';
import AccessDenied from '../components/common/AccessDenied';
import VendorPayoutsPanel from '../components/vendor/VendorPayoutsPanel';
import VendorOrderHistory from '../components/vendor/VendorOrderHistory';
import VendorAuctionsPanel from '../components/vendor/VendorAuctionsPanel';
import StoreSelector from '../components/vendor/StoreSelector';
import StoreListManager from '../components/vendor/StoreListManager';
import StoreProductManager from '../components/vendor/StoreProductManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Store, Package, ArrowRight, Layers, ShoppingBag } from 'lucide-react';

function VendorDashboardContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: stores, isLoading: storesLoading } = useMyStores();

  const principalStr = identity?.getPrincipal().toString() || '';
  const storedVendorId = typeof window !== 'undefined'
    ? localStorage.getItem(`vendorId_${principalStr}`)
    : null;

  // Track selected store; default to first store once loaded
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStoreId && stores && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const displayName = userProfile?.name || principalStr.slice(0, 12) + '…';

  return (
    <div className="space-y-8">
      {/* Store Selector */}
      {!storesLoading && stores && stores.length > 0 && (
        <div className="flex items-center gap-4 bg-card border border-border rounded px-4 py-3">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreChange={setSelectedStoreId}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-gold" />
            <span className="font-sans text-sm text-muted-foreground">Vendor Account</span>
          </div>
          <p className="font-serif text-xl text-foreground truncate">{displayName}</p>
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

      {/* My Stores */}
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl text-foreground">My Stores</h2>
        </div>
        <p className="font-sans text-sm text-muted-foreground mb-5">
          Manage all your stores under this vendor account. You can have up to 5 stores.
        </p>
        <StoreListManager />
      </div>

      {/* Store Products */}
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl text-foreground">Store Products</h2>
        </div>
        <p className="font-sans text-sm text-muted-foreground mb-5">
          Add and manage products for the selected store.
        </p>

        {storesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !selectedStoreId ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-sans text-sm text-muted-foreground">
              {stores && stores.length > 0
                ? 'Select a store above to manage its products.'
                : 'Create a store first to start adding products.'}
            </p>
          </div>
        ) : (
          <StoreProductManager
            storeId={selectedStoreId}
            vendorId={principalStr}
          />
        )}
      </div>

      {/* Auctions */}
      {storedVendorId && (
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">My Auctions</h2>
          <p className="font-sans text-sm text-muted-foreground mb-5">
            Create and manage auctions for your products with live countdown timers.
          </p>
          <VendorAuctionsPanel vendorId={storedVendorId} />
        </div>
      )}

      {/* Payouts */}
      {storedVendorId && (
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">My Payouts</h2>
          <VendorPayoutsPanel vendorId={storedVendorId} />
        </div>
      )}

      {/* Order History */}
      <div className="bg-card border border-border rounded p-6">
        <h2 className="font-serif text-xl text-foreground mb-5">Order History</h2>
        <p className="font-sans text-sm text-muted-foreground mb-5">
          All orders containing your products, with commission and net payout details.
        </p>
        <VendorOrderHistory />
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
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Vendor</p>
        <h1 className="font-serif text-3xl text-foreground">My Store Dashboard</h1>
      </div>
      <VendorDashboardContent />
    </main>
  );
}
