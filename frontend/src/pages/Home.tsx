import React from 'react';
import { useSearchProducts } from '../hooks/useQueries';
import { Variant_quantityDesc_priceDesc_priceAsc } from '../types';
import ProductGrid from '../components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Sparkles, ShieldCheck, Truck } from 'lucide-react';

export default function Home() {
  const { data: products, isLoading } = useSearchProducts({
    keyword: null,
    category: null,
    productType: null,
    sortBy: Variant_quantityDesc_priceDesc_priceAsc.quantityDesc,
  });

  const featured = (products ?? []).slice(0, 8);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/generated/hero-banner.dim_1440x480.png"
            alt="Fragrance collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <p className="font-sans text-xs text-gold uppercase tracking-[0.3em] mb-4">
            Luxury Fragrance Marketplace
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-4">
            Discover Your Signature Scent
          </h1>
          <p className="font-sans text-base text-muted-foreground max-w-xl mx-auto mb-8">
            Curated fragrances from independent artisan vendors. Find rare perfumes, exclusive colognes, and bespoke scents.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="font-sans bg-gold text-background hover:bg-gold/90">
              <Link to="/products">Shop Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-sans border-gold/30 text-bronze hover:bg-gold/5">
              <Link to="/auctions">Live Auctions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Sparkles className="w-6 h-6 text-gold" />, title: 'Curated Selection', desc: 'Hand-picked fragrances from verified artisan vendors worldwide.' },
            { icon: <ShieldCheck className="w-6 h-6 text-gold" />, title: 'Authenticity Guaranteed', desc: 'Every product verified for authenticity before listing.' },
            { icon: <Truck className="w-6 h-6 text-gold" />, title: 'Secure Delivery', desc: 'Careful packaging and tracked shipping on all physical orders.' },
          ].map((f) => (
            <div key={f.title} className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                {f.icon}
              </div>
              <h3 className="font-serif text-lg text-foreground">{f.title}</h3>
              <p className="font-sans text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-1">Featured</p>
            <h2 className="font-serif text-2xl text-foreground">Popular Fragrances</h2>
          </div>
          <Button asChild variant="ghost" className="font-sans text-sm text-muted-foreground hover:text-foreground">
            <Link to="/products">View All</Link>
          </Button>
        </div>
        <ProductGrid products={featured} isLoading={isLoading} />
      </section>
    </main>
  );
}
