import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, BellOff, Calendar, Eye, Radio } from "lucide-react";

import { motion } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";
import {
  type LiveStream,
  getLiveStreams,
  getScheduledStreams,
  getStreams,
} from "../utils/liveStream";

const REMIND_KEY = "fragrance_stream_reminders";

function getReminders(): string[] {
  try {
    const raw = localStorage.getItem(REMIND_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleReminder(id: string): boolean {
  const existing = getReminders();
  let updated: string[];
  if (existing.includes(id)) {
    updated = existing.filter((r) => r !== id);
  } else {
    updated = [...existing, id];
  }
  localStorage.setItem(REMIND_KEY, JSON.stringify(updated));
  return updated.includes(id);
}

function formatScheduled(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function LiveStreamCard({
  stream,
  index,
}: {
  stream: LiveStream;
  index: number;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:border-border/80 transition-all shadow-sm hover:shadow-md cursor-pointer"
      onClick={() =>
        navigate({ to: "/live/$streamId", params: { streamId: stream.id } })
      }
      data-ocid={`live_streams.stream_card.${index + 1}`}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video flex items-center justify-center"
        style={{ backgroundColor: stream.thumbnailColor }}
      >
        <Radio className="w-10 h-10 text-white/50" />
        {stream.status === "live" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs">
          <Eye className="w-3 h-3" />
          {formatViewers(stream.viewerCount)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif text-base text-foreground font-semibold leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {stream.title}
        </h3>
        <p className="font-sans text-xs text-muted-foreground mb-3">
          {stream.vendorName} · {stream.storeName}
        </p>
        <Button
          size="sm"
          className="font-sans w-full bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={(e) => {
            e.stopPropagation();
            navigate({
              to: "/live/$streamId",
              params: { streamId: stream.id },
            });
          }}
          data-ocid={`live_streams.watch_button.${index + 1}`}
        >
          <Radio className="w-3.5 h-3.5" />
          Watch Now
        </Button>
      </div>
    </motion.div>
  );
}

function ScheduledRow({
  stream,
  index,
}: {
  stream: LiveStream;
  index: number;
}) {
  const [reminded, setReminded] = useState(() =>
    getReminders().includes(stream.id),
  );

  const handleToggleRemind = () => {
    const newState = toggleReminder(stream.id);
    setReminded(newState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors"
    >
      {/* Thumbnail swatch */}
      <div
        className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: stream.thumbnailColor }}
      >
        <Radio className="w-6 h-6 text-white/50" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm font-semibold text-foreground truncate">
          {stream.title}
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          {stream.vendorName}
        </p>
        <p className="font-sans text-xs text-primary mt-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatScheduled(stream.scheduledAt)}
        </p>
      </div>

      {/* Remind button */}
      <Button
        variant={reminded ? "default" : "outline"}
        size="sm"
        className={`font-sans text-xs gap-1.5 flex-shrink-0 ${
          reminded ? "bg-primary text-primary-foreground" : ""
        }`}
        onClick={handleToggleRemind}
        data-ocid={`live_streams.remind_button.${index + 1}`}
      >
        {reminded ? (
          <>
            <BellOff className="w-3.5 h-3.5" />
            Reminded
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5" />
            Remind Me
          </>
        )}
      </Button>
    </motion.div>
  );
}

function EndedRow({ stream, index }: { stream: LiveStream; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/10 opacity-70"
    >
      <div
        className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center grayscale"
        style={{ backgroundColor: stream.thumbnailColor }}
      >
        <Radio className="w-6 h-6 text-white/30" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm font-semibold text-foreground truncate">
          {stream.title}
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          {stream.vendorName}
        </p>
        {stream.endedAt && (
          <p className="font-sans text-xs text-muted-foreground/70 mt-1">
            Ended {formatScheduled(stream.endedAt)}
          </p>
        )}
      </div>
      <Badge
        variant="outline"
        className="text-xs text-muted-foreground flex-shrink-0"
      >
        Ended
      </Badge>
    </motion.div>
  );
}

export default function LiveStreams() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [scheduledStreams, setScheduledStreams] = useState<LiveStream[]>([]);
  const [endedStreams, setEndedStreams] = useState<LiveStream[]>([]);

  const refresh = useCallback(() => {
    setLiveStreams(getLiveStreams());
    setScheduledStreams(getScheduledStreams());
    setEndedStreams(getStreams().filter((s) => s.status === "ended"));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Page Header */}
      <div className="mb-10">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
          Streaming
        </p>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
          <Radio className="w-7 h-7 text-red-500" />
          Live &amp; Upcoming
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 max-w-xl">
          Watch vendor product showcases in real time, explore new fragrances
          live, and never miss a drop.
        </p>
      </div>

      {/* Live Now */}
      <section className="mb-12" data-ocid="live_streams.live_section">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-serif text-xl text-foreground">Live Now</h2>
          {liveStreams.length > 0 && (
            <Badge className="bg-red-600 text-white text-xs px-2">
              {liveStreams.length}
            </Badge>
          )}
        </div>

        {liveStreams.length === 0 ? (
          <div
            className="py-12 text-center border border-dashed border-border rounded-xl"
            data-ocid="live_streams.live_empty_state"
          >
            <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg text-foreground mb-1">
              No streams live right now
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              Check back soon or set a reminder for upcoming streams below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveStreams.map((s, i) => (
              <LiveStreamCard key={s.id} stream={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mb-12" data-ocid="live_streams.upcoming_section">
        <div className="flex items-center gap-3 mb-5">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Upcoming</h2>
        </div>

        {scheduledStreams.length === 0 ? (
          <div
            className="py-10 text-center border border-dashed border-border rounded-xl"
            data-ocid="live_streams.upcoming_empty_state"
          >
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-sans text-sm text-muted-foreground">
              No upcoming streams scheduled.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledStreams.map((s, i) => (
              <ScheduledRow key={s.id} stream={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Past Streams */}
      {endedStreams.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Radio className="w-5 h-5 text-muted-foreground/60" />
            <h2 className="font-serif text-xl text-muted-foreground">
              Past Streams
            </h2>
          </div>
          <div className="space-y-3">
            {endedStreams.map((s, i) => (
              <EndedRow key={s.id} stream={s} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA for vendors */}
      <div className="mt-14 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center">
        <Radio className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="font-serif text-xl text-foreground mb-2">
          Are you a vendor?
        </h3>
        <p className="font-sans text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Start live streaming your fragrance showcases to thousands of
          customers. Go live directly from your vendor dashboard.
        </p>
        <Button asChild className="font-sans gap-2">
          <Link to="/vendor/dashboard">
            <Radio className="w-4 h-4" />
            Go to Vendor Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
