import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  Clock,
  Download,
  FileText,
  Music,
  Package,
  ShieldAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DigitalEntitlement,
  daysUntilExpiry,
  getAllEntitlements,
  isEntitlementValid,
  recordDownload,
} from "../utils/digitalDelivery";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileTypeIcon({ fileType }: { fileType: string }) {
  const ft = fileType.toUpperCase();
  if (ft === "MP3" || ft === "MP4" || ft === "WAV") {
    return <Music className="w-4 h-4" />;
  }
  if (ft === "PDF" || ft === "EPUB") {
    return <FileText className="w-4 h-4" />;
  }
  return <Archive className="w-4 h-4" />;
}

function fileTypeBadgeClass(fileType: string): string {
  const ft = fileType.toUpperCase();
  if (ft === "MP3" || ft === "MP4" || ft === "WAV") {
    return "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400";
  }
  if (ft === "PDF" || ft === "EPUB") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function expiryClass(days: number): string {
  if (days < 0) return "text-destructive";
  if (days <= 7) return "text-orange-500 dark:text-orange-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function expiryLabel(days: number): string {
  if (days < 0)
    return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
}

// ─── Download Card ────────────────────────────────────────────────────────────

interface DownloadCardProps {
  entitlement: DigitalEntitlement;
  index: number;
  onDownloaded: () => void;
}

function DownloadCard({
  entitlement: ent,
  index,
  onDownloaded,
}: DownloadCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const valid = isEntitlementValid(ent);
  const days = daysUntilExpiry(ent);
  const exhausted = ent.downloadCount >= ent.maxDownloads;
  const expired = days < 0;
  const usedPct = Math.min(100, (ent.downloadCount / ent.maxDownloads) * 100);

  const handleDownload = useCallback(() => {
    if (!valid) return;
    setIsDownloading(true);

    setTimeout(() => {
      const result = recordDownload(ent.id);
      if (result) {
        toast.success(`Downloading ${result.filename}…`, {
          description: `${ent.fileSize} · ${ent.fileType}`,
          duration: 4000,
        });
        onDownloaded();
      } else {
        toast.error("Download failed. Please try again.");
      }
      setIsDownloading(false);
    }, 600);
  }, [ent, valid, onDownloaded]);

  const ocidIdx = index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={`my_downloads.item.${ocidIdx}`}
      className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center group"
    >
      {/* Icon */}
      <div
        className={[
          "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
          valid
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-muted border border-border",
        ].join(" ")}
      >
        <FileTypeIcon fileType={ent.fileType} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-serif text-base text-foreground leading-snug">
            {ent.productTitle}
          </h3>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 font-mono shrink-0 ${fileTypeBadgeClass(ent.fileType)}`}
          >
            <FileTypeIcon fileType={ent.fileType} />
            <span className="ml-1">{ent.fileType}</span>
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-sans text-xs text-muted-foreground">
            {ent.fileSize}
          </span>

          {/* Download count progress */}
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
              <div
                className={[
                  "h-full rounded-full transition-all",
                  exhausted ? "bg-destructive/60" : "bg-emerald-500",
                ].join(" ")}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <span
              className={[
                "font-mono text-xs",
                exhausted ? "text-destructive" : "text-muted-foreground",
              ].join(" ")}
            >
              {ent.downloadCount} / {ent.maxDownloads} used
            </span>
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className={`font-sans text-xs ${expiryClass(days)}`}>
              {expiryLabel(days)}
            </span>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="shrink-0">
        {valid ? (
          <Button
            size="sm"
            className="font-sans gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDownload}
            disabled={isDownloading}
            data-ocid={`my_downloads.download_button.${ocidIdx}`}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing…" : "Download"}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="font-sans gap-2 cursor-not-allowed opacity-50"
                    data-ocid={`my_downloads.download_button.${ocidIdx}`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {expired ? "Expired" : "Limit Reached"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-sans text-xs">
                {expired
                  ? "This download link has expired."
                  : "You've reached the maximum download limit for this file."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyDownloads() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 text-center"
      data-ocid="my_downloads.empty_state"
    >
      <div className="mx-auto w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
        <Download className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h2 className="font-serif text-xl text-foreground mb-2">
        No digital purchases yet
      </h2>
      <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Browse our catalogue to find digital downloads — eBooks, sample packs,
        presets, and more.
      </p>
      <Button
        onClick={() => navigate({ to: "/products" })}
        variant="outline"
        className="font-sans"
      >
        Browse Products
      </Button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyDownloads() {
  const [entitlements, setEntitlements] = useState<DigitalEntitlement[]>([]);

  const refresh = useCallback(() => {
    setEntitlements(getAllEntitlements());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = entitlements.filter(isEntitlementValid);
  const expired = entitlements.filter((e) => !isEntitlementValid(e));

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
          Library
        </p>
        <div className="flex items-center gap-3">
          <Download className="w-7 h-7 text-foreground" />
          <h1 className="font-serif text-3xl text-foreground">My Downloads</h1>
        </div>
        <p className="font-sans text-sm text-muted-foreground mt-2">
          All your digital purchases. Each file can be downloaded up to 5 times
          within 30 days.
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger
            value="active"
            className="gap-2 font-sans text-sm"
            data-ocid="my_downloads.active_tab"
          >
            <Download className="w-3.5 h-3.5" />
            Active
            {active.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1.5 text-[10px] font-mono"
              >
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="expired"
            className="gap-2 font-sans text-sm"
            data-ocid="my_downloads.expired_tab"
          >
            <Clock className="w-3.5 h-3.5" />
            Expired
            {expired.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1.5 text-[10px] font-mono"
              >
                {expired.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <AnimatePresence mode="wait">
            {active.length === 0 ? (
              <EmptyDownloads />
            ) : (
              <div className="space-y-3">
                {active.map((ent, i) => (
                  <DownloadCard
                    key={ent.id}
                    entitlement={ent}
                    index={i}
                    onDownloaded={refresh}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="expired">
          <AnimatePresence mode="wait">
            {expired.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Package className="mx-auto w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-sans text-sm text-muted-foreground">
                  No expired downloads.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 opacity-70">
                {expired.map((ent, i) => (
                  <DownloadCard
                    key={ent.id}
                    entitlement={ent}
                    index={i}
                    onDownloaded={refresh}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </main>
  );
}
