import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerApproved } from '../hooks/useQueries';
import AccessDenied from '../components/common/AccessDenied';
import VendorRegistrationForm from '../components/vendor/VendorRegistrationForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { CheckCircle, Clock, Store } from 'lucide-react';

export default function VendorRegistration() {
  const { identity } = useInternetIdentity();
  const { data: isApproved, isLoading } = useIsCallerApproved();
  const [submitted, setSubmitted] = useState(false);

  if (!identity) {
    return <AccessDenied message="Please sign in to register as a vendor." />;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (isApproved) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-3">You're an Approved Vendor!</h2>
          <p className="text-muted-foreground font-sans mb-6">
            Your vendor account is active. Manage your store and products from the dashboard.
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/vendor/dashboard">
                <Store className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-bronze" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-3">Application Submitted</h2>
          <p className="text-muted-foreground font-sans mb-6 max-w-sm">
            Your vendor registration is pending admin review. You'll be able to access your store once approved.
          </p>
          <Button asChild variant="outline" className="border-gold/30 text-bronze hover:bg-gold/5">
            <Link to="/products">Browse the Marketplace</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Vendors</p>
        <h1 className="font-serif text-3xl text-foreground">Become a Vendor</h1>
        <p className="text-muted-foreground font-sans mt-2">
          Join our curated marketplace and share your fragrances with the world.
        </p>
      </div>

      <div className="bg-card border border-border rounded p-6">
        <VendorRegistrationForm onSuccess={() => setSubmitted(true)} />
      </div>
    </main>
  );
}
