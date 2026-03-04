import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Package2, Tag } from "lucide-react";
import React from "react";
import type { WholesaleTier } from "../../backend";

interface WholesaleTierTableProps {
  tiers: WholesaleTier[];
  isWholesaleApproved?: boolean;
}

function formatPrice(price: bigint | number): string {
  const num = typeof price === "bigint" ? Number(price) : price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num / 100);
}

export default function WholesaleTierTable({
  tiers,
  isWholesaleApproved = false,
}: WholesaleTierTableProps) {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort(
    (a, b) => Number(a.minQty) - Number(b.minQty),
  );

  return (
    <div
      data-ocid="product.wholesale_tier_table"
      className="rounded-lg border border-gold/30 bg-accent/20 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-gold/10 border-b border-gold/20">
        <Tag className="w-4 h-4 text-gold" />
        <h3 className="font-serif text-sm font-semibold text-foreground">
          Wholesale Pricing
        </h3>
        <Badge
          variant="outline"
          className="ml-auto text-xs border-gold/40 text-gold"
        >
          Bulk Discounts
        </Badge>
      </div>

      <div className="divide-y divide-border/50">
        {sortedTiers.map((tier) => (
          <div
            key={`${tier.minQty}-${tier.pricePerUnit}`}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Package2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {Number(tier.minQty)}+ units
                </span>
              </div>
              {tier.tierLabel && (
                <span className="text-xs text-muted-foreground">
                  {tier.tierLabel}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gold">
                {formatPrice(tier.pricePerUnit)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">each</span>
            </div>
          </div>
        ))}
      </div>

      {!isWholesaleApproved && (
        <div className="px-4 py-3 bg-muted/40 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Wholesale pricing available —{" "}
            <Link
              to="/wholesale"
              className="text-gold hover:text-bronze underline underline-offset-2 font-medium"
            >
              register for wholesale access
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
