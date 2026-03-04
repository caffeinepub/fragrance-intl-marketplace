import { cn } from "@/lib/utils";
import React from "react";

// ─── Gateway definitions ──────────────────────────────────────────────────────

interface GatewayDefinition {
  id: string;
  name: string;
  description: string;
  logo: string; // emoji / text mark used as logo stand-in
  badge?: string;
}

const GATEWAYS: GatewayDefinition[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Credit & Debit Card",
    logo: "💳",
    badge: "Default",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Pay via PayPal account",
    logo: "🅿️",
  },
  {
    id: "square",
    name: "Square",
    description: "Square payments",
    logo: "⬛",
  },
  {
    id: "wise",
    name: "Wise",
    description: "Bank transfer (Wise)",
    logo: "🌐",
  },
  {
    id: "payoneer",
    name: "Payoneer",
    description: "Global payouts",
    logo: "🔶",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaymentGatewaySelectorProps {
  selectedGateway: string;
  onSelect: (gateway: string) => void;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentGatewaySelector({
  selectedGateway,
  onSelect,
  disabled = false,
}: PaymentGatewaySelectorProps) {
  const ocidMap: Record<string, string> = {
    stripe: "payment_gateway.stripe_option",
    paypal: "payment_gateway.paypal_option",
    square: "payment_gateway.square_option",
    wise: "payment_gateway.wise_option",
    payoneer: "payment_gateway.payoneer_option",
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Payment Method</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {GATEWAYS.map((gateway) => {
          const isSelected = selectedGateway === gateway.id;
          return (
            <button
              key={gateway.id}
              type="button"
              disabled={disabled}
              data-ocid={ocidMap[gateway.id]}
              onClick={() => onSelect(gateway.id)}
              className={cn(
                "relative flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                "hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary ring-2 ring-primary bg-primary/8 shadow-sm"
                  : "border-border bg-card",
                disabled && "pointer-events-none opacity-50",
              )}
              aria-pressed={isSelected}
            >
              {/* Badge */}
              {gateway.badge && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">
                  {gateway.badge}
                </span>
              )}

              {/* Logo */}
              <span className="text-2xl leading-none select-none" aria-hidden>
                {gateway.logo}
              </span>

              {/* Name + description */}
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {gateway.name}
                </p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {gateway.description}
                </p>
              </div>

              {/* Selected indicator dot */}
              {isSelected && (
                <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
