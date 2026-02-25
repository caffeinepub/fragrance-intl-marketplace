import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '420px' }}>
      <img
        src="/assets/generated/hero-banner.dim_1440x480.png"
        alt="Fragrance.Intl — Discover Rare Scents"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-brown/80 via-dark-brown/50 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col justify-center min-h-[420px]">
        <div className="max-w-xl space-y-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold font-sans text-sm uppercase tracking-[0.2em]">
              Curated Luxury Fragrances
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream leading-tight">
            Discover Your
            <br />
            <span className="text-gold italic">Signature Scent</span>
          </h1>

          <p className="font-sans text-cream/80 text-base sm:text-lg leading-relaxed max-w-md">
            Explore thousands of rare and exclusive fragrances from artisan vendors worldwide.
            From oud to florals, find the perfect expression of you.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-gold text-dark-brown hover:bg-gold/90 font-sans font-medium"
            >
              <Link to="/products">
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream/40 text-cream hover:bg-cream/10 font-sans"
            >
              <Link to="/vendor/register">Sell With Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
