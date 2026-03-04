import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Radio, Shield, ShoppingBag, Star, Truck } from "lucide-react";
import React from "react";
import ProductGrid from "../components/products/ProductGrid";
import { type LocalProduct, useSearchProducts } from "../hooks/useQueries";
import type { Product } from "../types/index";

function localToProduct(p: LocalProduct): Product {
  return {
    id: p.id,
    vendorId: p.storeId, // use storeId so navigation works
    title: p.title,
    description: p.description,
    price: p.price,
    stock: p.stock,
    category: p.category,
    productType: p.productType as any,
    status: p.status as any,
    image: p.image,
    variants: p.variants,
  };
}

export default function Home() {
  const { data: localProducts, isLoading, error } = useSearchProducts();

  const products: Product[] = (localProducts || []).map(localToProduct);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                Premium Fragrance Collection
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Discover Your
                <span className="text-primary block">Signature Scent</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Explore our curated collection of luxury fragrances from around
                the world. Find the perfect scent that tells your story.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Shop Now
                  </Button>
                </Link>
                <Link to="/auctions">
                  <Button size="lg" variant="outline">
                    View Auctions
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/assets/generated/hero-banner.dim_1440x480.png"
                  alt="Luxury Fragrances"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Top Rated</p>
                    <p className="text-xs text-muted-foreground">4.9/5 stars</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Authentic Products
                </h3>
                <p className="text-sm text-muted-foreground">
                  Every fragrance is verified authentic and sourced directly
                  from brands.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Fast Delivery
                </h3>
                <p className="text-sm text-muted-foreground">
                  Free shipping on orders over $50. Express delivery available.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Expert Curation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Hand-picked by fragrance experts for the finest selection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Streams Banner */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/20 via-background to-red-950/10 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <Radio className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground leading-tight">
                  Watch Live Vendor Showcases
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Vendors go live to present new arrivals, limited drops &amp;
                  exclusive offers.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="font-sans bg-red-600 hover:bg-red-700 text-white flex-shrink-0 gap-2"
            >
              <Link to="/live">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Watch Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Featured Products
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover our most popular fragrances
              </p>
            </div>
            <Link to="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
                <div key={k} className="space-y-3">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Failed to load products. Please try again.
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No products available yet.
              </p>
            </div>
          ) : (
            <ProductGrid products={products.slice(0, 8)} isLoading={false} />
          )}
        </div>
      </section>
    </div>
  );
}
