import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { OrderStatus } from '../../backend';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const STAGES: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: OrderStatus.pending, label: 'Pending', icon: Clock },
  { status: OrderStatus.processing, label: 'Processing', icon: Package },
  { status: OrderStatus.shipped, label: 'Shipped', icon: Truck },
  { status: OrderStatus.delivered, label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  [OrderStatus.pending]: 0,
  [OrderStatus.processing]: 1,
  [OrderStatus.shipped]: 2,
  [OrderStatus.delivered]: 3,
  [OrderStatus.canceled]: -1,
};

export default function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  const isCanceled = currentStatus === OrderStatus.canceled;
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <div className="w-full">
      {isCanceled ? (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded border border-border">
          <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-sans text-sm font-medium text-muted-foreground">Order Canceled</p>
            <p className="font-sans text-xs text-muted-foreground/70">This order has been canceled.</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" aria-hidden="true">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{
                width: currentIndex === 0 ? '0%' : `${(currentIndex / (STAGES.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Stages */}
          <div className="relative flex justify-between">
            {STAGES.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.status} className="flex flex-col items-center gap-2 flex-1">
                  {/* Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                      ${isCompleted
                        ? 'bg-gold border-gold text-primary-foreground'
                        : isCurrent
                        ? 'bg-card border-gold text-gold shadow-sm shadow-gold/20'
                        : 'bg-card border-border text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isFuture ? 'opacity-40' : ''}`} />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      font-sans text-xs text-center leading-tight
                      ${isCompleted || isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}
                      ${isFuture ? 'opacity-50' : ''}
                    `}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
