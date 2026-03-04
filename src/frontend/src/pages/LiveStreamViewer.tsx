import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  MessageCircle,
  Radio,
  Send,
  ShoppingBag,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type LiveStream,
  getStream,
  updateStreamStatus,
} from "../utils/liveStream";

// ── Chat simulation ────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  isUser?: boolean;
  timestamp: Date;
};

const FAKE_AUTHORS = [
  "Aisha_Scents",
  "OudLover88",
  "ParisianNose",
  "ScentHunter",
  "FragranceQueen",
  "PerfumeConnoisseur",
  "AromaExplorer",
  "WoodNotesOnly",
];

const FAKE_MESSAGES = [
  "This smells incredible! Just ordered 100ml 🌹",
  "How long does the sillage last on this one?",
  "Love the notes! Is it limited edition?",
  "Could you compare this to Baccarat Rouge?",
  "Ordered last week, arrived in perfect condition!",
  "The bottle design is stunning 😍",
  "What's the concentration — EDP or EDT?",
  "Does it work well in summer heat?",
  "This is on my wishlist — next paycheck!",
  "Any international shipping available?",
  "The opening is divine, especially the bergamot",
  "Does this layer well with your rose collection?",
];

function generateFakeMessage(): ChatMessage {
  const author = FAKE_AUTHORS[Math.floor(Math.random() * FAKE_AUTHORS.length)];
  const text = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    author,
    text,
    isUser: false,
    timestamp: new Date(),
  };
}

function seedMessages(): ChatMessage[] {
  const now = Date.now();
  return Array.from({ length: 7 }, (_, i) => ({
    id: `seed_${i}`,
    author: FAKE_AUTHORS[i % FAKE_AUTHORS.length],
    text: FAKE_MESSAGES[i],
    isUser: false,
    timestamp: new Date(now - (7 - i) * 1000 * 25),
  }));
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown(targetDate: Date): string {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Starting soon…");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(
        `${h > 0 ? `${h}h ` : ""}${m.toString().padStart(2, "0")}m ${s
          .toString()
          .padStart(2, "0")}s`,
      );
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LiveStreamViewer() {
  const { streamId } = useParams({ strict: false }) as { streamId: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const countdown = useCountdown(
    stream?.scheduledAt ?? new Date(Date.now() + 3_600_000),
  );

  const refreshStream = useCallback(() => {
    const s = getStream(streamId);
    setStream(s);
    if (s) setViewerCount(s.viewerCount);
  }, [streamId]);

  useEffect(() => {
    refreshStream();
    setMessages(seedMessages());
  }, [refreshStream]);

  // Fluctuate viewer count every 10 seconds
  useEffect(() => {
    if (!stream || stream.status !== "live") return;
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.floor(Math.random() * 20) - 8;
        return Math.max(10, prev + delta);
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [stream]);

  // Add a new fake chat message every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev, generateFakeMessage()]);
    }, 8_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat on every message update
  const scrollToBottom = useCallback(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `user_${Date.now()}`,
      author: identity?.getPrincipal().toString().slice(0, 8) ?? "You",
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const handleGoLive = () => {
    const updated = updateStreamStatus(streamId, "live");
    if (updated) setStream(updated);
  };

  const handleEndStream = () => {
    const updated = updateStreamStatus(streamId, "ended");
    if (updated) setStream(updated);
  };

  if (!stream) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="font-serif text-xl text-foreground mb-2">
          Stream not found
        </p>
        <Button asChild variant="outline" className="font-sans mt-4">
          <Link to="/live">Browse Live Streams</Link>
        </Button>
      </main>
    );
  }

  const isLive = stream.status === "live";
  const isScheduled = stream.status === "scheduled";
  const isEnded = stream.status === "ended";

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="font-sans gap-2 mb-6 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: "/live" })}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Live Streams
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Panel (Video) ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Frame */}
          <div
            className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-video"
            data-ocid="stream_viewer.video_frame"
          >
            {isLive ? (
              <iframe
                src={stream.embedUrl}
                title={stream.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center"
                style={{ backgroundColor: stream.thumbnailColor }}
              >
                {isScheduled ? (
                  <>
                    <Radio className="w-14 h-14 text-white/30 mb-4" />
                    <p className="font-serif text-white/80 text-xl mb-2">
                      Stream Not Yet Live
                    </p>
                    <p className="font-sans text-white/50 text-sm mb-4">
                      Starts in
                    </p>
                    <div className="bg-black/40 rounded-xl px-6 py-3">
                      <p className="font-mono text-2xl text-white font-bold tracking-widest">
                        {countdown}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Radio className="w-14 h-14 text-white/20 mb-4" />
                    <p className="font-serif text-white/60 text-xl">
                      Stream Ended
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Stream title overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
              <div className="flex items-center gap-2">
                {isLive && (
                  <Badge className="bg-red-600 text-white text-xs px-2 gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </Badge>
                )}
                {isEnded && (
                  <Badge
                    variant="outline"
                    className="text-white/70 border-white/30 text-xs"
                  >
                    ENDED
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-xl text-foreground mb-1">
                {stream.title}
              </h1>
              <p className="font-sans text-sm text-muted-foreground">
                {stream.vendorName} · {stream.storeName}
              </p>
              {stream.description && (
                <p className="font-sans text-sm text-muted-foreground mt-2 max-w-xl">
                  {stream.description}
                </p>
              )}
            </div>
            <div
              className="flex items-center gap-2 text-muted-foreground"
              data-ocid="stream_viewer.viewer_count"
            >
              <Users className="w-4 h-4" />
              <span className="font-sans text-sm font-semibold tabular-nums">
                {viewerCount.toLocaleString()}
              </span>
              <span className="font-sans text-xs">watching</span>
            </div>
          </div>

          {/* Vendor Controls */}
          {isLoggedIn && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <Radio className="w-4 h-4 text-muted-foreground" />
              <span className="font-sans text-sm text-muted-foreground flex-1">
                Vendor controls
              </span>
              {!isLive && !isEnded && (
                <Button
                  size="sm"
                  className="font-sans bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={handleGoLive}
                  data-ocid="stream_viewer.go_live_button"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Go Live
                </Button>
              )}
              {isLive && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-sans gap-2"
                  onClick={handleEndStream}
                  data-ocid="stream_viewer.end_stream_button"
                >
                  End Stream
                </Button>
              )}
              {isEnded && (
                <Badge
                  variant="outline"
                  className="text-muted-foreground text-xs"
                >
                  Stream ended
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* ── Right Panel (Chat + Products) ────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Live Chat */}
          <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-sans text-sm font-semibold text-foreground">
                Live Chat
              </h3>
              {isLive && (
                <span className="ml-auto font-sans text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {viewerCount}
                </span>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="h-80" data-ocid="stream_viewer.chat_list">
              <div className="p-3 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        msg.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {!msg.isUser && (
                        <p className="font-sans text-[10px] font-semibold opacity-70 mb-0.5">
                          {msg.author}
                        </p>
                      )}
                      <p className="font-sans text-xs leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isLoggedIn ? "Say something…" : "Login to chat"}
                disabled={!isLoggedIn}
                className="font-sans text-sm h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                data-ocid="stream_viewer.chat_input"
              />
              <Button
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                disabled={!isLoggedIn || !chatInput.trim()}
                onClick={handleSendMessage}
                data-ocid="stream_viewer.chat_submit_button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Featured Products */}
          {stream.productIds.length > 0 && (
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-sans text-sm font-semibold text-foreground">
                  Featured Products
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {stream.productIds.map((pid) => (
                  <Button
                    key={pid}
                    asChild
                    variant="outline"
                    size="sm"
                    className="font-sans text-xs w-full gap-2 justify-start"
                  >
                    <Link
                      to="/products/$storeId/$productId"
                      params={{ storeId: stream.storeId, productId: pid }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      View Product
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Empty products state */}
          {stream.productIds.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <ShoppingBag className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-sans text-xs text-muted-foreground">
                No featured products in this stream
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
