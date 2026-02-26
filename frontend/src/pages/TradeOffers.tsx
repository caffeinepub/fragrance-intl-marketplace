import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyTradeOffers } from '../hooks/useQueries';
import type { TradeOffer } from '../types';
import TradeOfferGrid from '../components/trade/TradeOfferGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';
import { ArrowLeftRight, Plus } from 'lucide-react';

export default function TradeOffers() {
  const { identity } = useInternetIdentity();
  const { data: offers, isLoading, refetch } = useGetMyTradeOffers();

  const currentUserId = identity?.getPrincipal().toString() ?? '';

  const incoming = (offers ?? []).filter(
    (o: TradeOffer) => o.targetPrincipal === currentUserId,
  );
  const outgoing = (offers ?? []).filter(
    (o: TradeOffer) => o.offeredBy === currentUserId,
  );

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Marketplace</p>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-gold" />
            <h1 className="font-serif text-3xl text-foreground">Trade Offers</h1>
          </div>
        </div>
        <Button asChild className="font-sans bg-gold text-background hover:bg-gold/90">
          <Link to="/trade-offers/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New Trade Offer
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="mb-6">
          <TabsTrigger value="incoming" className="font-sans text-sm">
            Incoming
            {incoming.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{incoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="font-sans text-sm">
            Outgoing
            {outgoing.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{outgoing.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <TradeOfferGrid
            offers={incoming}
            perspective="incoming"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="outgoing">
          <TradeOfferGrid
            offers={outgoing}
            perspective="outgoing"
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
