import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitReview } from "../../hooks/useQueries";
import { StarRatingInput } from "./StarRating";

interface SubmitReviewFormProps {
  productId: string;
  storeId: string;
}

type FormErrors = {
  rating?: string;
  title?: string;
  body?: string;
};

export function SubmitReviewForm({
  productId,
  storeId,
}: SubmitReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const submitReview = useSubmitReview();

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (rating === 0) errs.rating = "Please select a star rating.";
    if (!title.trim() || title.trim().length < 3)
      errs.title = "Title must be at least 3 characters.";
    if (!body.trim() || body.trim().length < 10)
      errs.body = "Review must be at least 10 characters.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus first error field
      const firstErrKey = Object.keys(errs)[0];
      const el = document.querySelector<HTMLElement>(
        firstErrKey === "rating"
          ? "[data-ocid='review.rating.input'] button"
          : firstErrKey === "title"
            ? "[data-ocid='review.title.input']"
            : "[data-ocid='review.body.textarea']",
      );
      el?.focus();
      return;
    }
    setErrors({});

    try {
      await submitReview.mutateAsync({
        productId,
        storeId,
        rating,
        title: title.trim(),
        body: body.trim(),
      });
      setSubmitted(true);
      setRating(0);
      setTitle("");
      setBody("");
      toast.success("Review submitted — thank you!");
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center space-y-2"
        data-ocid="review.success_state"
      >
        <div className="text-3xl">✨</div>
        <p className="font-semibold text-foreground">
          Thank you for your review!
        </p>
        <p className="text-sm text-muted-foreground">
          Your feedback helps other shoppers.
        </p>
        <Button
          variant="link"
          size="sm"
          className="text-primary"
          onClick={() => setSubmitted(false)}
        >
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      data-ocid="review.form"
    >
      {/* Star picker */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Your Rating <span className="text-destructive">*</span>
        </Label>
        <StarRatingInput
          value={rating}
          onChange={(r) => {
            setRating(r);
            if (errors.rating)
              setErrors((prev) => ({ ...prev, rating: undefined }));
          }}
          size="lg"
        />
        {errors.rating && (
          <p
            className="text-xs text-destructive"
            data-ocid="review.error_state"
            role="alert"
          >
            {errors.rating}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="review-title" className="text-sm font-medium">
          Review Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="review-title"
          placeholder="Summarise your experience…"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title)
              setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          maxLength={120}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "review-title-error" : undefined}
          data-ocid="review.title.input"
        />
        {errors.title && (
          <p
            id="review-title-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Label htmlFor="review-body" className="text-sm font-medium">
          Review <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="review-body"
          placeholder="Tell us what you loved (or didn't)…"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (errors.body)
              setErrors((prev) => ({ ...prev, body: undefined }));
          }}
          rows={4}
          maxLength={2000}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? "review-body-error" : undefined}
          data-ocid="review.body.textarea"
        />
        <div className="flex justify-between items-start">
          {errors.body ? (
            <p
              id="review-body-error"
              className="text-xs text-destructive"
              role="alert"
            >
              {errors.body}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            {body.length}/2000
          </span>
        </div>
      </div>

      {submitReview.isError && (
        <p
          className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2"
          data-ocid="review.error_state"
          role="alert"
        >
          Something went wrong. Please try again.
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={submitReview.isPending}
        data-ocid="review.submit_button"
      >
        {submitReview.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
