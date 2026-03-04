// ─── Live Stream Utility ───────────────────────────────────────────────────
// All data stored in localStorage under `fragrance_streams`

const STORAGE_KEY = "fragrance_streams";

export type StreamStatus = "scheduled" | "live" | "ended";

export type LiveStream = {
  id: string;
  vendorId: string;
  vendorName: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  rtmpKey: string;
  embedUrl: string;
  status: StreamStatus;
  scheduledAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  viewerCount: number;
  productIds: string[];
  thumbnailColor: string;
};

type SerializedStream = Omit<
  LiveStream,
  "scheduledAt" | "startedAt" | "endedAt"
> & {
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

function serialize(s: LiveStream): SerializedStream {
  return {
    ...s,
    scheduledAt: s.scheduledAt.toISOString(),
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
  };
}

function deserialize(raw: SerializedStream): LiveStream {
  return {
    ...raw,
    scheduledAt: new Date(raw.scheduledAt),
    startedAt: raw.startedAt ? new Date(raw.startedAt) : null,
    endedAt: raw.endedAt ? new Date(raw.endedAt) : null,
  };
}

function generateId(): string {
  return `stream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateRtmpKey(vendorId: string): string {
  return `live_${vendorId.slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`;
}

const SAMPLE_STREAMS: LiveStream[] = [
  {
    id: "stream_sample_001",
    vendorId: "vendor_fragrance_house",
    vendorName: "Fragrance House",
    storeId: "store_fragrance_house_001",
    storeName: "Fragrance House",
    title: "Winter Oud Collection Showcase",
    description:
      "Explore our exclusive winter oud collection live — featuring rare woods, resins, and spicy compositions perfect for the cold season.",
    rtmpKey: "live_vendor_fr_abcdef12",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    status: "live",
    scheduledAt: new Date(Date.now() - 1000 * 60 * 30),
    startedAt: new Date(Date.now() - 1000 * 60 * 25),
    endedAt: null,
    viewerCount: 142,
    productIds: [],
    thumbnailColor: "#7c3f00",
  },
  {
    id: "stream_sample_002",
    vendorId: "vendor_scent_studio",
    vendorName: "Scent Studio",
    storeId: "store_scent_studio_001",
    storeName: "Scent Studio Paris",
    title: "Spring Florals — New Arrivals",
    description:
      "A live walkthrough of our freshest spring arrivals: jasmine, rose, iris, and peony-forward compositions.",
    rtmpKey: "live_vendor_ss_xyz98765",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 3),
    startedAt: null,
    endedAt: null,
    viewerCount: 0,
    productIds: [],
    thumbnailColor: "#6b21a8",
  },
];

function load(): LiveStream[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: SerializedStream[] = JSON.parse(raw);
      return parsed.map(deserialize);
    }
  } catch {
    // fall through to seed
  }
  return [];
}

function save(streams: LiveStream[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(streams.map(serialize)));
}

function seedIfEmpty(): void {
  const existing = load();
  if (existing.length > 0) return;
  save(SAMPLE_STREAMS);
}

export function getStreams(): LiveStream[] {
  seedIfEmpty();
  return load().sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime(),
  );
}

export function getStream(id: string): LiveStream | null {
  return getStreams().find((s) => s.id === id) ?? null;
}

export function getLiveStreams(): LiveStream[] {
  return getStreams().filter((s) => s.status === "live");
}

export function getScheduledStreams(): LiveStream[] {
  return getStreams().filter((s) => s.status === "scheduled");
}

export function createStream(
  data: Omit<
    LiveStream,
    "id" | "rtmpKey" | "embedUrl" | "startedAt" | "endedAt" | "viewerCount"
  >,
): LiveStream {
  const streams = load();
  const newStream: LiveStream = {
    ...data,
    id: generateId(),
    rtmpKey: generateRtmpKey(data.vendorId),
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    startedAt: null,
    endedAt: null,
    viewerCount: 0,
  };
  save([newStream, ...streams]);
  return newStream;
}

export function updateStreamStatus(
  id: string,
  status: StreamStatus,
): LiveStream | null {
  const streams = load();
  let updated: LiveStream | null = null;
  const newStreams = streams.map((s) => {
    if (s.id !== id) return s;
    updated = {
      ...s,
      status,
      startedAt: status === "live" && !s.startedAt ? new Date() : s.startedAt,
      endedAt: status === "ended" ? new Date() : s.endedAt,
      viewerCount:
        status === "live"
          ? Math.floor(Math.random() * 200) + 20
          : status === "ended"
            ? 0
            : s.viewerCount,
    };
    return updated;
  });
  save(newStreams);
  return updated;
}

export function deleteStream(id: string): void {
  const streams = load();
  save(streams.filter((s) => s.id !== id));
}
