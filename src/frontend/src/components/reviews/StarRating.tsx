import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import React from "react";

// ─── Display Mode ─────────────────────────────────────────────────────────────

interface StarRatingDisplayProps {
  rating: number; // 0–5, supports decimals
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showNumeric?: boolean;
  className?: string;
}

const STAR_INDICES = [0, 1, 2, 3, 4] as const;

export function StarRatingDisplay({
  rating,
  totalReviews,
  size = "md",
  showNumeric = true,
  className,
}: StarRatingDisplayProps) {
  const sizePx = size === "sm" ? 14 : size === "md" ? 18 : 24;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {STAR_INDICES.map((i) => {
          const filled = Math.min(Math.max(rating - i, 0), 1);
          return <StarIcon key={`star-${i}`} fill={filled} sizePx={sizePx} />;
        })}
      </div>
      {showNumeric && (
        <span
          className={cn(
            "font-semibold text-foreground",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
          )}
        >
          {rating > 0 ? rating.toFixed(1) : "—"}
        </span>
      )}
      {totalReviews !== undefined && (
        <span
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {totalReviews === 0
            ? "No reviews yet"
            : `(${totalReviews.toLocaleString()} ${totalReviews === 1 ? "review" : "reviews"})`}
        </span>
      )}
    </div>
  );
}

// ─── Input Mode ───────────────────────────────────────────────────────────────

interface StarRatingInputProps {
  value: number; // 0 = none selected
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function StarRatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hovered, setHovered] = React.useState(0);
  const sizePx = size === "sm" ? 16 : size === "md" ? 24 : 32;
  const active = hovered || value;

  return (
    <fieldset
      className={cn("flex items-center gap-1 border-0 p-0 m-0", className)}
      aria-label="Star rating"
      data-ocid="review.rating.input"
    >
      {STAR_INDICES.map((i) => {
        const starNum = i + 1;
        return (
          <button
            key={`star-btn-${starNum}`}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${starNum} star${starNum > 1 ? "s" : ""}`}
            onClick={() => onChange(starNum)}
            onMouseEnter={() => setHovered(starNum)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              "transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
              !disabled && "hover:scale-110 cursor-pointer",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <StarIcon
              fill={active >= starNum ? 1 : 0}
              sizePx={sizePx}
              className={cn(
                "transition-colors duration-100",
                active >= starNum
                  ? "text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </fieldset>
  );
}

// ─── Shared star shape ────────────────────────────────────────────────────────

function StarIcon({
  fill,
  sizePx,
  className,
}: {
  fill: number; // 0–1
  sizePx: number;
  className?: string;
}) {
  const id = React.useId();

  if (fill <= 0) {
    return (
      <Star
        style={{ width: sizePx, height: sizePx }}
        className={cn("text-muted-foreground/30", className)}
        strokeWidth={1.5}
      />
    );
  }

  if (fill >= 1) {
    return (
      <Star
        style={{ width: sizePx, height: sizePx }}
        className={cn("fill-amber-400 text-amber-400", className)}
        strokeWidth={1.5}
      />
    );
  }

  // Partial fill via SVG clipPath
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`partial-${id}`}>
          <rect x="0" y="0" width={fill * 24} height="24" />
        </clipPath>
      </defs>
      {/* Empty star */}
      <Star
        className="text-muted-foreground/30"
        strokeWidth={1.5}
        style={{ color: "currentColor" }}
      />
      {/* Filled portion */}
      <g clipPath={`url(#partial-${id})`}>
        <Star className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
      </g>
    </svg>
  );
}
