import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Archive, Download, FileText, Music, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { ProductType } from "../../backend";
import { useListStoreProducts } from "../../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIGITAL_SETTINGS_KEY = "fragrance_digital_product_settings";

interface DigitalProductSettings {
  fileType: string;
  fileSize: string;
  deliveryEnabled: boolean;
}

function loadSettings(): Record<string, DigitalProductSettings> {
  try {
    const raw = localStorage.getItem(DIGITAL_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(all: Record<string, DigitalProductSettings>): void {
  localStorage.setItem(DIGITAL_SETTINGS_KEY, JSON.stringify(all));
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  switch ((fileType || "").toUpperCase()) {
    case "MP3":
    case "MP4":
    case "WAV":
      return <Music className="w-4 h-4" />;
    case "PDF":
    case "EPUB":
      return <FileText className="w-4 h-4" />;
    default:
      return <Archive className="w-4 h-4" />;
  }
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VendorDigitalManagerProps {
  selectedStoreId?: string;
}

export default function VendorDigitalManager({
  selectedStoreId,
}: VendorDigitalManagerProps) {
  const { data: rawProducts, isLoading } =
    useListStoreProducts(selectedStoreId);
  const [settings, setSettings] =
    useState<Record<string, DigitalProductSettings>>(loadSettings);

  // Persist settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const digitalProducts = (rawProducts || []).filter((p) => {
    const pt =
      typeof p.productType === "string"
        ? p.productType
        : (Object.keys(p.productType as object)[0] ?? "");
    return pt === ProductType.digital || pt === "digital";
  });

  const getSettings = (productId: string): DigitalProductSettings =>
    settings[productId] ?? {
      fileType: "ZIP",
      fileSize: "",
      deliveryEnabled: true,
    };

  const updateSetting = <K extends keyof DigitalProductSettings>(
    productId: string,
    key: K,
    value: DigitalProductSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [productId]: {
        ...getSettings(productId),
        ...prev[productId],
        [key]: value,
      },
    }));
  };

  if (!selectedStoreId) {
    return (
      <div className="py-10 text-center border border-dashed border-border rounded-xl">
        <Download className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-sans text-sm text-muted-foreground">
          Select a store to manage digital products.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (digitalProducts.length === 0) {
    return (
      <div
        className="py-14 text-center border border-dashed border-border rounded-xl"
        data-ocid="vendor_digital.product_list"
      >
        <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="font-serif text-lg text-foreground mb-2">
          No digital products yet
        </p>
        <p className="font-sans text-sm text-muted-foreground max-w-xs mx-auto">
          Products marked as "Digital" type in your store will appear here for
          download delivery configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="vendor_digital.product_list">
      {digitalProducts.map((product, idx) => {
        const s = getSettings(product.id);
        const ocidIdx = idx + 1;
        // Mock stats — deterministic from product id
        const mockUnitsSold = (product.id.charCodeAt(0) % 47) + 3;
        const mockDownloadsServed =
          mockUnitsSold * (2 + (product.id.charCodeAt(1) % 3));

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            data-ocid={`vendor_digital.item.${ocidIdx}`}
            className="bg-card border border-border rounded-xl p-5 space-y-4"
          >
            {/* Product header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FileTypeIcon fileType={s.fileType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-serif text-base text-foreground leading-snug truncate">
                    {product.title}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
                  >
                    Digital
                  </Badge>
                </div>
                <p className="font-sans text-sm text-muted-foreground">
                  {formatPrice(Number(product.price))}
                </p>
              </div>
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File Type */}
              <div className="space-y-1.5">
                <Label
                  htmlFor={`filetype-${product.id}`}
                  className="font-sans text-xs text-muted-foreground uppercase tracking-wide"
                >
                  File Type
                </Label>
                <Input
                  id={`filetype-${product.id}`}
                  value={s.fileType}
                  onChange={(e) =>
                    updateSetting(
                      product.id,
                      "fileType",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="ZIP, PDF, MP3…"
                  className="font-mono text-sm h-8"
                  maxLength={8}
                  data-ocid={`vendor_digital.filetype_input.${ocidIdx}`}
                />
              </div>

              {/* File Size */}
              <div className="space-y-1.5">
                <Label
                  htmlFor={`filesize-${product.id}`}
                  className="font-sans text-xs text-muted-foreground uppercase tracking-wide"
                >
                  File Size
                </Label>
                <Input
                  id={`filesize-${product.id}`}
                  value={s.fileSize}
                  onChange={(e) =>
                    updateSetting(product.id, "fileSize", e.target.value)
                  }
                  placeholder="e.g. 12.4 MB"
                  className="font-sans text-sm h-8"
                />
              </div>
            </div>

            {/* Toggle + Stats row */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  id={`delivery-${product.id}`}
                  checked={s.deliveryEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting(product.id, "deliveryEnabled", checked)
                  }
                  data-ocid={`vendor_digital.toggle.${ocidIdx}`}
                />
                <Label
                  htmlFor={`delivery-${product.id}`}
                  className="font-sans text-sm text-muted-foreground cursor-pointer"
                >
                  {s.deliveryEnabled ? "Delivery enabled" : "Delivery disabled"}
                </Label>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {mockUnitsSold}
                  </p>
                  <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
                    Units sold
                  </p>
                </div>
                <div className="border-l border-border/50 pl-4">
                  <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {mockDownloadsServed}
                  </p>
                  <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
                    Downloads
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
