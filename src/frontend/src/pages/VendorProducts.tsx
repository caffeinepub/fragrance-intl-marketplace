import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import StoreProductManager from "../components/vendor/StoreProductManager";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerApproved } from "../hooks/useQueries";

export default function VendorProducts() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isApproved, isLoading } = useIsCallerApproved();

  const principalStr = identity?.getPrincipal().toString() || "";
  const storedVendorId =
    typeof window !== "undefined"
      ? localStorage.getItem(`vendorId_${principalStr}`)
      : null;

  if (!identity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to manage your products.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-2">Approval Required</h2>
        <p className="text-muted-foreground mb-6">
          Your vendor account must be approved before you can manage products.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  if (!storedVendorId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-2">No Store Found</h2>
        <p className="text-muted-foreground mb-6">
          Please register your store first.
        </p>
        <Button onClick={() => navigate({ to: "/vendor/register" })}>
          Register Store
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
          Vendor
        </p>
        <h1 className="font-serif text-3xl text-foreground">My Products</h1>
      </div>
      <StoreProductManager storeId={storedVendorId} vendorId={principalStr} />
    </main>
  );
}
