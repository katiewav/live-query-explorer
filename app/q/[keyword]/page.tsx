"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type {
  PlatformFilter,
  TimeFilter,
  QueryState,
  RedditResult,
  InstagramResult,
  TikTokResult,
  SummaryPayload,
  RedditPost,
  InstagramPost,
  TikTokPost,
} from "@/types";
import PlatformTab from "@/components/PlatformTab";
import CostBadge from "@/components/CostBadge";
import LoadingStream from "@/components/LoadingStream";
import SummaryStrip from "@/components/SummaryStrip";
import SoundtrackPanel from "@/components/SoundtrackPanel";
import { RedditCard, InstagramCard, TikTokCard } from "@/components/PostCard";
import ThemeToggle from "@/components/ThemeToggle";

function decodeKeyword(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isWithinTime(timestamp: number | string, filter: TimeFilter): boolean {
  if (filter === "all") return true;
  const now = Date.now();
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp * 1000;
  if (isNaN(ts)) return true;
  const cutoff = filter === "24h" ? now - 24 * 3600 * 1000 : now - 7 * 24 * 3600 * 1000;
  return ts >= cutoff;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = decodeKeyword(params.keyword as string);
  const initialPlatform = (searchParams.get("platform") as PlatformFilter) || "all";
  const initialTime = (searchParams.get("time") as TimeFilter) || "all";

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialPlatform);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTime);
  const [startTime] = useState(Date.now());

  const [state, setState] = useState<QueryState>({
    reddit: { data: null, loading: true },
    instagram: { data: null, loading: true },
    tiktok: { data: null, loading: true },
    summary: null,
    summaryLoading: true,
    totalCost: 0,
    totalCalls: 0,
    totalDuration: 0,
    isMock: false,
    done: false,
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (timeFilter !== "all") params.set("time", timeFilter);
    const qs = params.toString();
    const newPath = `/q/${encodeURIComponent(keyword)}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newPath);
  }, [platformFilter, timeFilter, keyword]);

  // SSE connection
  useEffect(() => {
    const url = `/api/query?q=${encodeURIComponent(keyword)}`;
    const eventSource = new EventSource(url);
    let isMock = false;

    eventSource.addEventListener("reddit", (e) => {
      const data = JSON.parse(e.data);
      if (data.mock) isMock = true;
      setState((prev) => ({
        ...prev,
        reddit: { data: data as RedditResult, loading: false },
        totalCost: prev.totalCost + (data.cost ?? 0),
        totalCalls: prev.totalCalls + (data.cost > 0 ? Math.round(data.cost / 0.06) : 0),
        totalDuration: Date.now() - startTime,
        isMock,
      }));
    });

    eventSource.addEventListener("instagram", (e) => {
      const data = JSON.parse(e.data);
      if (data.mock) isMock = true;
      setState((prev) => ({
        ...prev,
        instagram: { data: data as InstagramResult, loading: false },
        totalCost: prev.totalCost + (data.cost ?? 0),
        totalCalls: prev.totalCalls + (data.cost > 0 ? Math.round(data.cost / 0.06) : 0),
        totalDuration: Date.now() - startTime,
        isMock,
      }));
    });

    eventSource.addEventListener("tiktok", (e) => {
      const data = JSON.parse(e.data);
      if (data.mock) isMock = true;
      setState((prev) => ({
        ...prev,
        tiktok: { data: data as TikTokResult, loading: false },
        totalCost: prev.totalCost + (data.cost ?? 0),
        totalCalls: prev.totalCalls + (data.cost > 0 ? Math.round(data.cost / 0.06) : 0),
        totalDuration: Date.now() - startTime,
        isMock,
      }));
    });

    eventSource.addEventListener("summary", (e) => {
      const data = JSON.parse(e.data) as SummaryPayload;
      setState((prev) => ({
        ...prev,
        summary: data,
        summaryLoading: false,
        totalCost: data.totalCost ?? prev.totalCost,
        totalCalls: data.totalCalls ?? prev.totalCalls,
        totalDuration: Date.now() - startTime,
      }));
    });

    eventSource.addEventListener("done", () => {
      setState((prev) => ({
        ...prev,
        done: true,
        totalDuration: Date.now() - startTime,
      }));
      eventSource.close();
    });

    eventSource.onerror = () => {
      setState((prev) => ({
        ...prev,
        done: true,
        reddit: { ...prev.reddit, loading: false },
        instagram: { ...prev.instagram, loading: false },
        tiktok: { ...prev.tiktok, loading: false },
        summaryLoading: false,
        totalDuration: Date.now() - startTime,
      }));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [keyword, startTime]);

  // Filter posts by time
  const filteredReddit = useMemo(() => {
    if (!state.reddit.data) return [];
    return state.reddit.data.posts.filter((p: RedditPost) =>
      isWithinTime(p.created_utc, timeFilter)
    );
  }, [state.reddit.data, timeFilter]);

  const filteredInstagram = useMemo(() => {
    if (!state.instagram.data) return [];
    return state.instagram.data.posts.filter((p: InstagramPost) =>
      isWithinTime(p.timestamp, timeFilter)
    );
  }, [state.instagram.data, timeFilter]);

  const filteredTiktok = useMemo(() => {
    if (!state.tiktok.data) return [];
    return state.tiktok.data.posts.filter((p: TikTokPost) =>
      isWithinTime(p.create_time, timeFilter)
    );
  }, [state.tiktok.data, timeFilter]);

  const loadingStatuses = [
    { platform: "reddit", done: !state.reddit.loading, error: state.reddit.data?.error ?? false },
    { platform: "instagram", done: !state.instagram.loading, error: state.instagram.data?.error ?? false },
    { platform: "tiktok", done: !state.tiktok.loading, error: state.tiktok.data?.error ?? false },
  ];

  const showReddit = platformFilter === "all" || platformFilter === "reddit";
  const showInstagram = platformFilter === "all" || platformFilter === "instagram";
  const showTiktok = platformFilter === "all" || platformFilter === "tiktok";

  return (
    <main className="min-h-screen bg-bg">
      {/* Mock data banner */}
      {state.isMock && (
        <div className="bg-mixed/10 border-b border-mixed/20 px-4 py-2 text-center">
          <span className="text-mixed text-xs font-mono">
            Demo mode — showing sample data
          </span>
        </div>
      )}

      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.push("/")}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="font-mono text-text-primary text-lg truncate max-w-[40ch]">
              {keyword}
            </h1>

            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <PlatformTab active={platformFilter} onChange={setPlatformFilter} />

              <div className="flex gap-1">
                {(["all", "7d", "24h"] as TimeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      timeFilter === t
                        ? "bg-accent text-black"
                        : "bg-surface text-text-muted hover:text-text-primary border border-border"
                    }`}
                  >
                    {t === "all" ? "All" : t === "7d" ? "7d" : "24h"}
                  </button>
                ))}
              </div>

              <CostBadge
                cost={state.totalCost}
                calls={state.totalCalls}
                duration={state.totalDuration}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {timeFilter !== "all" && (
          <p className="text-text-muted text-xs font-mono italic mb-4">
            Date filter applied to returned sample, not full platform history.
          </p>
        )}

        {/* Loading stream */}
        <LoadingStream statuses={loadingStatuses} />

        {/* Summary */}
        {state.summary && (
          <div className="mb-12 animate-fade-slide-up">
            <SummaryStrip summary={state.summary} />
          </div>
        )}

        {/* Reddit section */}
        {showReddit && (
          <Section
            title="Reddit"
            loading={state.reddit.loading}
            error={state.reddit.data?.error}
            postCount={filteredReddit.length}
          >
            <div className="space-y-3">
              {filteredReddit.map((post, i) => (
                <div key={post.id} className="animate-fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <RedditCard post={post} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Instagram section */}
        {showInstagram && (
          <Section
            title="Instagram"
            loading={state.instagram.loading}
            error={state.instagram.data?.error}
            postCount={filteredInstagram.length}
          >
            {/* Tags strip */}
            {state.instagram.data && state.instagram.data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {state.instagram.data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#E1306C]/5 border border-[#E1306C]/20 rounded-full text-xs font-mono text-[#E1306C]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {filteredInstagram.map((post, i) => (
                <div key={post.id} className="animate-fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <InstagramCard post={post} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* TikTok section */}
        {showTiktok && (
          <Section
            title="TikTok"
            loading={state.tiktok.loading}
            error={state.tiktok.data?.error}
            postCount={filteredTiktok.length}
          >
            {/* Soundtrack panel */}
            {state.tiktok.data && state.tiktok.data.sounds.length > 0 && (
              <div className="mb-6">
                <SoundtrackPanel sounds={state.tiktok.data.sounds} keyword={keyword} />
              </div>
            )}
            <div className="space-y-3">
              {filteredTiktok.map((post, i) => (
                <div key={post.id} className="animate-fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <TikTokCard post={post} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

// ── Section wrapper ──

function Section({
  title,
  loading,
  error,
  postCount,
  children,
}: {
  title: string;
  loading: boolean;
  error?: boolean;
  postCount: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-mono text-text-primary text-base font-medium">{title}</h2>
        {!loading && (
          <span className="text-text-muted text-xs font-mono">
            {postCount} in sample
          </span>
        )}
        {loading && (
          <span className="text-text-muted text-xs font-mono animate-pulse">loading...</span>
        )}
      </div>

      {!loading && error && postCount === 0 && (
        <div className="p-4 bg-surface border border-border rounded-lg">
          <p className="text-text-muted text-sm font-mono">
            No results in this sample — try a broader keyword.
          </p>
        </div>
      )}

      {!loading && !error && postCount === 0 && (
        <div className="p-4 bg-surface border border-border rounded-lg">
          <p className="text-text-muted text-sm font-mono">
            No results match the current time filter. Try &ldquo;All&rdquo; to see full sample.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && postCount > 0 && children}
    </section>
  );
}
