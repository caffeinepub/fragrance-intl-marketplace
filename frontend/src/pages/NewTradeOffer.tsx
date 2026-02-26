import React from 'react';
import { Link } from '@tanstack/react-router';
import NewTradeOfferForm from '../components/trade/NewTradeOfferForm';
import { ArrowLeft } from 'lucide-react';

export default function NewTradeOffer() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-6">
        <Link
          to="/trade-offers"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Trade Offers
        </Link>
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Trade</p>
        <h1 className="font-serif text-3xl text-foreground">New Trade Offer</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Propose a trade with another user by specifying items to offer and request.
        </p>
      </div>

      <div className="bg-card border border-border rounded p-6">
        <NewTradeOfferForm />
      </div>
    </main>
  );
}
