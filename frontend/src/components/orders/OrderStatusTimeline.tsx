import React from 'react';
import { OrderStatus } from '../../types';
import { Check, X } from 'lucide-react';

interface OrderStatusTimelineProps {
  status: OrderStatus | string;
}

const STAGES: OrderStatus[] = [
  OrderStatus.pending,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.delivered,
];

export default function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const isCanceled = status === OrderStatus.canceled;
  const currentIndex = STAGES.indexOf(status as OrderStatus);

  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, i) => {
        const isCompleted = !isCanceled && currentIndex > i;
        const isCurrent = !isCanceled && currentIndex === i;
        const isFuture = isCanceled || currentIndex < i;

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-gold border-gold text-background'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCanceled && i === 0 ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-sans capitalize whitespace-nowrap ${
                  isCurrent ? 'text-gold font-medium' : isFuture ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 mx-1 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
      {isCanceled && (
        <div className="ml-3 flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-red-500 bg-red-500/10">
            <X className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-[10px] font-sans text-red-500 font-medium">Canceled</span>
        </div>
      )}
    </div>
  );
}
