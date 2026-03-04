import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Eye, Plus, Radio, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  type LiveStream,
  type StreamStatus,
  createStream,
  deleteStream,
  getStreams,
  updateStreamStatus,
} from "../../utils/liveStream";

const STATUS_CONFIG: Record<
  StreamStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Scheduled",
    className:
      "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  live: {
    label: "Live",
    className: "text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10",
  },
  ended: {
    label: "Ended",
    className: "text-muted-foreground border-border",
  },
};

const THUMBNAIL_COLORS = [
  "#7c3f00",
  "#6b21a8",
  "#15803d",
  "#1e3a5f",
  "#7f1d1d",
  "#064e3b",
  "#1e1b4b",
  "#713f12",
];

function formatScheduled(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type Props = {
  selectedStoreId?: string;
};

export default function VendorStreamManager({ selectedStoreId }: Props) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() || "";

  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24);
    return d.toISOString().slice(0, 16);
  });

  const refresh = useCallback(() => {
    const all = getStreams();
    const vendorStreams = all.filter((s) => s.vendorId === principalStr);
    setStreams(vendorStreams);
  }, [principalStr]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24);
    setFormScheduledAt(d.toISOString().slice(0, 16));
  };

  const handleCreate = () => {
    if (!formTitle.trim()) {
      toast.error("Stream title is required");
      return;
    }
    if (!selectedStoreId) {
      toast.error("Please select a store first");
      return;
    }

    const color =
      THUMBNAIL_COLORS[Math.floor(Math.random() * THUMBNAIL_COLORS.length)];

    createStream({
      vendorId: principalStr,
      vendorName: identity?.getPrincipal().toString().slice(0, 12) ?? "Vendor",
      storeId: selectedStoreId,
      storeName: selectedStoreId,
      title: formTitle.trim(),
      description: formDesc.trim(),
      status: "scheduled",
      scheduledAt: new Date(formScheduledAt),
      productIds: [],
      thumbnailColor: color,
    });

    toast.success("Stream created and scheduled!");
    resetForm();
    setCreateDialogOpen(false);
    refresh();
  };

  const handleGoLive = (id: string) => {
    updateStreamStatus(id, "live");
    toast.success("Stream is now live!");
    refresh();
    navigate({ to: "/live/$streamId", params: { streamId: id } });
  };

  const handleEnd = (id: string) => {
    updateStreamStatus(id, "ended");
    toast.success("Stream ended");
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteStream(id);
    toast.success("Stream deleted");
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg text-foreground">
            My Live Streams
          </h3>
          <p className="font-sans text-sm text-muted-foreground mt-0.5">
            Schedule and manage your vendor live streams
          </p>
        </div>
        <Button
          className="font-sans gap-2"
          onClick={() => setCreateDialogOpen(true)}
          data-ocid="vendor_streams.create_button"
        >
          <Plus className="w-4 h-4" />
          Create Stream
        </Button>
      </div>

      {/* Streams List */}
      {streams.length === 0 ? (
        <div
          className="py-14 text-center border border-dashed border-border rounded-xl"
          data-ocid="vendor_streams.empty_state"
        >
          <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-lg text-foreground mb-2">
            No streams yet
          </p>
          <p className="font-sans text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Create your first live stream to showcase products to customers in
            real time.
          </p>
          <Button
            className="font-sans gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create First Stream
          </Button>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="vendor_streams.list">
          {streams.map((stream, i) => {
            const idx = i + 1;
            const statusCfg = STATUS_CONFIG[stream.status];
            const isLive = stream.status === "live";
            const isEnded = stream.status === "ended";

            return (
              <div
                key={stream.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                data-ocid={`vendor_streams.item.${idx}`}
              >
                {/* Thumbnail */}
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: stream.thumbnailColor }}
                >
                  <Radio className="w-5 h-5 text-white/50" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-sans text-sm font-semibold text-foreground truncate">
                      {stream.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 ${statusCfg.className}`}
                    >
                      {isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />
                      )}
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground">
                    {formatScheduled(stream.scheduledAt)}
                  </p>
                  {isLive && (
                    <p className="font-sans text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3" />
                      {stream.viewerCount.toLocaleString()} watching
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="font-sans text-xs h-7 px-2 gap-1"
                  >
                    <Link to="/live/$streamId" params={{ streamId: stream.id }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </Button>

                  {!isLive && !isEnded && (
                    <Button
                      size="sm"
                      className="font-sans text-xs h-7 px-2 bg-red-600 hover:bg-red-700 text-white gap-1"
                      onClick={() => handleGoLive(stream.id)}
                      data-ocid={`vendor_streams.golive_button.${idx}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Go Live
                    </Button>
                  )}

                  {isLive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="font-sans text-xs h-7 px-2"
                      onClick={() => handleEnd(stream.id)}
                      data-ocid={`vendor_streams.end_button.${idx}`}
                    >
                      End
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-sans text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(stream.id)}
                    data-ocid={`vendor_streams.delete_button.${idx}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Stream Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="vendor_streams.create_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif">Create Live Stream</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Stream Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Winter Oud Collection Showcase"
                className="font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Tell viewers what you'll be showcasing…"
                className="font-sans resize-none h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm">
                Scheduled Date &amp; Time
              </Label>
              <Input
                type="datetime-local"
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
                className="font-sans"
              />
            </div>

            {!selectedStoreId && (
              <p className="font-sans text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-3 py-2">
                Select a store in the Overview tab to enable stream creation.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setCreateDialogOpen(false);
              }}
              className="font-sans"
              data-ocid="vendor_streams.create_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedStoreId}
              className="font-sans"
              data-ocid="vendor_streams.create_submit_button"
            >
              <Radio className="w-4 h-4 mr-2" />
              Schedule Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
