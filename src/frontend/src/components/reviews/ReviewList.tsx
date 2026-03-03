import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import React from "react";
import { useGetProductReviews, useIsCallerAdmin } from "../../hooks/useQueries";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  productId: string;
  storeId: string;
}

const SKELETON_KEYS = ["skeleton-a", "skeleton-b", "skeleton-c"] as const;

export function ReviewList({ productId }: ReviewListProps) {
  const { data: reviews, isLoading } = useGetProductReviews(productId);
  const { data: isAdmin } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="reviews.list">
        {SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="border border-border/60 rounded-lg p-4 space-y-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-ocid="reviews.empty_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No reviews yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
          Be the first to share your thoughts on this product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="reviews.list">
      {reviews.map((review, idx) => (
        <ReviewCard
          key={review.id}
          review={review}
          isAdmin={!!isAdmin}
          index={idx + 1}
        />
      ))}
    </div>
  );
}
