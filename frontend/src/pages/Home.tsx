import React from 'react';
import HeroBanner from '../components/layout/HeroBanner';
import ProductGrid from '../components/products/ProductGrid';
import { useSearchProducts } from '../hooks/useQueries';
import { Variant_quantityDesc_priceDesc_priceAsc } from '../backend';
import { Sparkles, TrendingUp, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Curated Selection',
    desc: 'Hand-picked fragrances from artisan vendors and luxury houses worldwide.',
  },
  {
    icon: TrendingUp,
    title: 'Multi-Vendor Marketplace',
    desc: 'Discover unique scents from independent perfumers and established brands.',
  },
  {
    icon: Shield,
    title: 'Secure & Decentralized',
    desc: 'Powered by ICP blockchain for transparent, trustless transactions.',
  },
];

export default function Home() {
  const { data: featuredProducts, isLoading } = useSearchProducts({
    sortBy: Variant_quantityDesc_priceDesc_priceAsc.priceDesc,
  });

  const featured = featuredProducts?.slice(0, 8) || [];

  return (
    <main>
      <HeroBanner />

      {/* Features */}
      <section className="bg-secondary/30 border-y border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base text-foreground mb-1">{feature.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">Marketplace</p>
            <h2 className="font-serif text-3xl text-foreground">Featured Fragrances</h2>
          </div>
        </div>
        <ProductGrid products={featured} isLoading={isLoading} emptyMessage="No products listed yet. Be the first vendor!" />
      </section>
    </main>
  );
}
