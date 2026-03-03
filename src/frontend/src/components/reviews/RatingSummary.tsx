import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useGetProductRatingSummary } from "../../hooks/useQueries";
import { StarRatingDisplay } from "./StarRating";

interface RatingSummaryProps {
  productId: string;
}

const STAR_BARS = [5, 4, 3, 2, 1] as const;
const SKELETON_BARS = ["bar-1", "bar-2", "bar-3", "bar-4", "bar-5"] as const;

export function RatingSummary({ productId }: RatingSummaryProps) {
  const { data: summary, isLoading } = useGetProductRatingSummary(productId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-28" />
        <Skeleton className="h-5 w-40" />
        {SKELETON_BARS.map((key) => (
          <Skeleton key={key} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const { averageRating, totalReviews, distribution } = summary;
  const maxBar = Math.max(...distribution, 1);

  return (
    <div className="space-y-4">
      {/* Big average */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold text-foreground leading-none">
          {totalReviews > 0 ? averageRating.toFixed(1) : "—"}
        </span>
        <div className="pb-1 space-y-1">
          <StarRatingDisplay
            rating={averageRating}
            showNumeric={false}
            size="md"
          />
          <p className="text-sm text-muted-foreground">
            {totalReviews === 0
              ? "No reviews yet"
              : `${totalReviews.toLocaleString()} ${totalReviews === 1 ? "review" : "reviews"}`}
          </p>
        </div>
      </div>

      {/* Distribution bars: 5-star → 1-star */}
      <div className="space-y-2">
        {STAR_BARS.map((star) => {
          const count = distribution[star - 1] ?? 0;
          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          const barWidth = totalReviews > 0 ? (count / maxBar) * 100 : 0;

          return (
            <div
              key={`star-bar-${star}`}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-6 text-right text-muted-foreground font-medium shrink-0">
                {star}
              </span>
              <span className="text-amber-400 text-xs">★</span>
              <div
                className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                aria-label={`${star}-star reviews: ${pct.toFixed(0)}%`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
