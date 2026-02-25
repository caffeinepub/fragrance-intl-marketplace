import React from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useListTradeOffersForUser } from '../hooks/useQueries';
import TradeOfferGrid from '../components/trade/TradeOfferGrid';
import AccessDenied from '../components/common/AccessDenied';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Plus } from 'lucide-react';

export default function TradeOffers() {
  const { identity } = useInternetIdentity();

  if (!identity) {
    return <AccessDenied message="Please sign in to view your trade offers." />;
  }

  const currentUserId = identity.getPrincipal().toString();

  return <TradeOffersContent currentUserId={currentUserId} />;
}

function TradeOffersContent({ currentUserId }: { currentUserId: string }) {
  const { data: offers, isLoading, refetch } = useListTradeOffersForUser(currentUserId);

  const incoming = (offers ?? []).filter((o) => o.receiverId === currentUserId);
  const outgoing = (offers ?? []).filter((o) => o.initiatorId === currentUserId);

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Marketplace</p>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-gold" />
            Trade Offers
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-2">
            Manage your incoming and outgoing barter trade offers.
          </p>
        </div>
        <Button asChild className="bg-gold hover:bg-gold/90 text-background font-sans font-medium self-start sm:self-auto">
          <Link to="/trade-offers/new">
            <Plus className="w-4 h-4 mr-2" />
            New Trade Offer
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming">
        <TabsList className="mb-6">
          <TabsTrigger value="incoming" className="font-sans">
            Incoming
            {incoming.length > 0 && (
              <span className="ml-2 bg-gold/20 text-gold text-xs rounded-full px-1.5 py-0.5 font-mono">
                {incoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="font-sans">
            Outgoing
            {outgoing.length > 0 && (
              <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5 font-mono">
                {outgoing.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <TradeOfferGrid
            offers={incoming}
            currentUserId={currentUserId}
            isLoading={isLoading}
            emptyMessage="No incoming trade offers. When someone sends you a trade offer, it will appear here."
            onAction={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="outgoing">
          <TradeOfferGrid
            offers={outgoing}
            currentUserId={currentUserId}
            isLoading={isLoading}
            emptyMessage="You haven't sent any trade offers yet. Click 'New Trade Offer' to get started."
            onAction={() => refetch()}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
