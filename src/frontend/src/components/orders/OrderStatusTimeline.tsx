import { Check, X } from "lucide-react";
import React from "react";
import type { OrderStatus } from "../../types";

const STEPS: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

interface OrderStatusTimelineProps {
  status: OrderStatus | string;
}

export default function OrderStatusTimeline({
  status,
}: OrderStatusTimelineProps) {
  const isCanceled = status === "canceled";
  const currentIndex = STEPS.indexOf(status as OrderStatus);

  return (
    <div className="w-full">
      {isCanceled ? (
        <div className="flex items-center gap-2 text-destructive">
          <X className="w-5 h-5" />
          <span className="font-medium">Order Canceled</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentIndex >= index;
            const isCurrent = currentIndex === index;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs capitalize ${isCompleted ? "text-primary font-medium" : "text-muted-foreground"}`}
                  >
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      currentIndex > index ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
