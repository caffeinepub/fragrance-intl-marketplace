import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerApproved } from '../hooks/useQueries';
import AccessDenied from '../components/common/AccessDenied';
import ProductListManager from '../components/vendor/ProductListManager';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorProducts() {
  const { identity } = useInternetIdentity();
  const { data: isApproved, isLoading } = useIsCallerApproved();

  const principalStr = identity?.getPrincipal().toString() || '';
  const storedVendorId = typeof window !== 'undefined'
    ? localStorage.getItem(`vendorId_${principalStr}`)
    : null;

  if (!identity) {
    return <AccessDenied message="Please sign in to manage your products." />;
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
        message="Your vendor account must be approved before you can manage products."
        showHomeLink
      />
    );
  }

  if (!storedVendorId) {
    return (
      <AccessDenied
        message="No store found. Please register your store first."
        showHomeLink
      />
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Vendor</p>
        <h1 className="font-serif text-3xl text-foreground">My Products</h1>
      </div>
      <ProductListManager vendorId={storedVendorId} />
    </main>
  );
}
