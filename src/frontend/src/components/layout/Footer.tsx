import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(
    window.location.hostname || "fragrance-intl",
  );

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/logo-mark.dim_256x256.png"
                alt="Fragrance.Intl"
                className="w-7 h-7 rounded object-cover"
              />
              <span className="font-serif text-base text-foreground">
                Fragrance<span className="text-gold">.Intl</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed max-w-xs">
              A curated multi-vendor marketplace for the world's finest
              fragrances.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm text-foreground uppercase tracking-widest">
              Marketplace
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Shop All", to: "/products" },
                { label: "Become a Vendor", to: "/vendor/register" },
                { label: "My Orders", to: "/my-orders" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-gold transition-colors font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm text-foreground uppercase tracking-widest">
              Legal
            </h4>
            <ul className="space-y-2">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground font-sans cursor-default">
                      {item}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-sans">
            © {year} Fragrance.Intl. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-gold fill-gold" /> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
