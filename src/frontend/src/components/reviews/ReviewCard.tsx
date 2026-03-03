import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import React from "react";
import type { LocalReview } from "../../hooks/useQueries";
import { useDeleteReview } from "../../hooks/useQueries";
import { StarRatingDisplay } from "./StarRating";

interface ReviewCardProps {
  review: LocalReview;
  isAdmin?: boolean;
  index: number;
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 7)}…${principal.slice(-5)}`;
}

function formatReviewDate(timestamp: number): string {
  // Motoko timestamps are in nanoseconds
  const ms = timestamp > 1e15 ? Math.floor(timestamp / 1_000_000) : timestamp;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export function ReviewCard({
  review,
  isAdmin = false,
  index,
}: ReviewCardProps) {
  const deleteReview = useDeleteReview();

  const handleDelete = async () => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    await deleteReview.mutateAsync({
      productId: review.productId,
      reviewId: review.id,
    });
  };

  return (
    <Card
      className="border border-border/60 bg-card/80 luxury-shadow"
      data-ocid="review.card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <StarRatingDisplay
              rating={review.rating}
              showNumeric={false}
              size="sm"
            />
            <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {review.title}
            </h4>
          </div>

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleteReview.isPending}
              aria-label="Delete review"
              data-ocid={`review.delete_button.${index}`}
            >
              {deleteReview.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
          {review.body}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span className="font-mono">
            {truncatePrincipal(review.reviewer)}
          </span>
          <time
            dateTime={new Date(
              review.createdAt > 1e15
                ? Math.floor(review.createdAt / 1_000_000)
                : review.createdAt,
            ).toISOString()}
          >
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
      </CardContent>
    </Card>
  );
}
