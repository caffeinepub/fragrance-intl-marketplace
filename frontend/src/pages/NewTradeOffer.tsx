import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AccessDenied from '../components/common/AccessDenied';
import NewTradeOfferForm from '../components/trade/NewTradeOfferForm';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export default function NewTradeOffer() {
  const { identity } = useInternetIdentity();

  if (!identity) {
    return <AccessDenied message="Please sign in to create a trade offer." />;
  }

  const currentUserId = identity.getPrincipal().toString();

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
        <Link to="/trade-offers">
          <ArrowLeft className="w-4 h-4 mr-1" />
          My Trade Offers
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Marketplace</p>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
          <ArrowLeftRight className="w-7 h-7 text-gold" />
          New Trade Offer
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2">
          Propose a barter exchange with another user. Specify what you offer and what you want in return.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded p-6">
        <NewTradeOfferForm currentUserId={currentUserId} />
      </div>
    </main>
  );
}
