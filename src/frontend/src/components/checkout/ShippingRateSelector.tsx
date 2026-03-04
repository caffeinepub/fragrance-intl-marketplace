import { Badge } from "@/components/ui/badge";
import { Clock, Package, Truck, Zap } from "lucide-react";
import React from "react";
import {
  type ShippingRate,
  formatShippingPrice,
  getShippingRates,
} from "../../utils/shipping";

interface ShippingRateSelectorProps {
  destinationPin: string;
  onSelect: (rate: ShippingRate) => void;
  selectedRate: ShippingRate | null;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  STD: <Package className="w-5 h-5" />,
  EXP: <Truck className="w-5 h-5" />,
  OVN: <Zap className="w-5 h-5" />,
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  STD: "Reliable standard delivery across India",
  EXP: "Fast delivery for time-sensitive shipments",
  OVN: "Next-day delivery guaranteed by 10:30 AM",
};

export default function ShippingRateSelector({
  destinationPin,
  onSelect,
  selectedRate,
}: ShippingRateSelectorProps) {
  // Origin is always our vendor warehouse PIN
  const originPin = "110001";
  // Typical fragrance parcel ~500g
  const weightGrams = 500;

  const rates = React.useMemo(
    () => getShippingRates(originPin, destinationPin, weightGrams),
    [destinationPin],
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-gold" />
        <h3 className="font-serif text-base text-foreground">
          Select Shipping Service
        </h3>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans bg-muted/50 rounded-lg px-3 py-2">
        <span>
          From: <strong className="text-foreground">110001</strong> (Vendor
          Warehouse)
        </span>
        <span className="text-border">·</span>
        <span>
          To:{" "}
          <strong className="text-foreground">{destinationPin || "—"}</strong>
        </span>
      </div>

      {/* Rate cards */}
      <div className="space-y-2">
        {rates.map((rate, idx) => {
          const isSelected = selectedRate?.serviceCode === rate.serviceCode;
          const ocidIdx = idx + 1;

          return (
            <button
              key={rate.serviceCode}
              type="button"
              onClick={() => onSelect(rate)}
              data-ocid={`shipping_rate_selector.option.${ocidIdx}`}
              className={[
                "w-full text-left rounded-xl border p-4 transition-all duration-150",
                "bg-card hover:bg-muted/30 cursor-pointer",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Icon + service info */}
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "p-2 rounded-lg shrink-0",
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {SERVICE_ICONS[rate.serviceCode] ?? (
                      <Truck className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-sm font-semibold text-foreground">
                        {rate.serviceName}
                      </p>
                      {rate.serviceCode === "OVN" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-gold/40 text-gold bg-gold/10 px-1.5 py-0"
                        >
                          Fastest
                        </Badge>
                      )}
                      {rate.serviceCode === "STD" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0"
                        >
                          Best Value
                        </Badge>
                      )}
                    </div>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      {SERVICE_DESCRIPTIONS[rate.serviceCode]}
                    </p>
                  </div>
                </div>

                {/* Right: Price + ETA */}
                <div className="text-right shrink-0">
                  <p className="font-sans text-base font-bold text-foreground tabular-nums">
                    {formatShippingPrice(rate.priceInCents)}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {rate.estimatedDays === 1
                      ? "1 business day"
                      : `${rate.estimatedDays} business days`}
                  </p>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-primary/20 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-sans text-xs text-primary font-medium">
                    Selected
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!selectedRate && (
        <p className="font-sans text-xs text-muted-foreground text-center py-1">
          Please select a shipping service to continue
        </p>
      )}
    </div>
  );
}
