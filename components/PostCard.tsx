"use client";

import type { RedditPost, InstagramPost, TikTokPost } from "@/types";

function timeAgo(timestamp: number | string): string {
  const now = Date.now();
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp * 1000;
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function estimateGeo(subreddit: string, text: string): string | null {
  const geoSubreddits: Record<string, string> = {
    nyc: "New York", london: "London", europe: "Europe", paris: "Paris",
    tokyo: "Tokyo", berlin: "Berlin", sydney: "Sydney", canada: "Canada",
    india: "India", uk: "UK", australia: "Australia", losangeles: "LA",
  };
  const sub = subreddit.toLowerCase();
  if (geoSubreddits[sub]) return geoSubreddits[sub];

  // Non-Latin script detection
  if (/[\u3000-\u9FFF]/.test(text)) return "East Asia";
  if (/[\u0600-\u06FF]/.test(text)) return "Middle East";
  if (/[\u0400-\u04FF]/.test(text)) return "Eastern Europe";
  return null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Reddit Card ──

export function RedditCard({ post }: { post: RedditPost }) {
  const geo = estimateGeo(post.subreddit, post.title + post.selftext);
  return (
    <div className="p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[#ff4500]/10 text-[#ff4500] text-xs font-mono rounded">
          r/{post.subreddit}
        </span>
        <span className="text-text-muted text-xs font-mono">{timeAgo(post.created_utc)}</span>
        {geo && (
          <span className="text-text-muted text-xs font-mono italic" title="Geography estimated from available signals.">
            {geo}
          </span>
        )}
      </div>
      <h3 className="text-text-primary font-mono text-sm font-medium mb-1">
        {post.title}
      </h3>
      {post.selftext && (
        <p className="text-text-muted text-xs mb-3 line-clamp-2">{post.selftext}</p>
      )}
      <div className="flex items-center gap-4 text-xs font-mono text-text-muted mb-3">
        <span>{formatNumber(post.score)} pts</span>
        <span className="text-text-primary font-medium">{formatNumber(post.num_comments)} comments</span>
        <span>u/{post.author}</span>
      </div>
      {post.top_comments && post.top_comments.length > 0 && (
        <div className="border-l-2 border-border pl-3 space-y-2">
          {post.top_comments.slice(0, 2).map((c) => (
            <div key={c.id} className="text-xs">
              <p className="text-text-muted">{c.body.slice(0, 150)}</p>
              <span className="text-text-muted/50 font-mono">
                {formatNumber(c.score)} pts · u/{c.author}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Instagram Card ──

export function InstagramCard({ post }: { post: InstagramPost }) {
  return (
    <div className="p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[#E1306C]/10 text-[#E1306C] text-xs font-mono rounded">
          @{post.owner_username}
        </span>
        <span className="text-text-muted text-xs font-mono">{timeAgo(post.timestamp)}</span>
      </div>
      <p className="text-text-primary text-sm mb-3 line-clamp-3">
        {post.caption.slice(0, 120)}{post.caption.length > 120 ? "..." : ""}
      </p>
      <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
        <span>{formatNumber(post.like_count)} likes</span>
        <span>{formatNumber(post.comment_count)} comments</span>
        <span className="uppercase text-text-muted/50">{post.media_type}</span>
      </div>
    </div>
  );
}

// ── TikTok Card ──

export function TikTokCard({ post }: { post: TikTokPost }) {
  return (
    <div className="p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[#00f2ea]/10 text-[#00f2ea] text-xs font-mono rounded">
          @{post.author_name}
        </span>
        <span className="text-text-muted text-xs font-mono">{timeAgo(post.create_time)}</span>
      </div>
      <p className="text-text-primary text-sm mb-3 line-clamp-3">
        {post.desc.slice(0, 120)}{post.desc.length > 120 ? "..." : ""}
      </p>
      <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
        <span>{formatNumber(post.digg_count)} likes</span>
        <span>{formatNumber(post.comment_count)} comments</span>
        <span>{formatNumber(post.play_count)} views</span>
      </div>
      {post.music_title && (
        <div className="mt-2 text-xs text-text-muted/70 font-mono">
          ♫ {post.music_title}
        </div>
      )}
    </div>
  );
}
