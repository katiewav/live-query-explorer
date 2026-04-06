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
  const href = post.permalink?.startsWith("http")
    ? post.permalink
    : post.url?.startsWith("http")
    ? post.url
    : post.permalink
    ? `https://reddit.com${post.permalink}`
    : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors group"
    >
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
        <svg className="w-3 h-3 text-text-muted/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </div>
      <h3 className="text-text-primary font-mono text-sm font-medium mb-1 group-hover:text-accent transition-colors">
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
    </a>
  );
}

// ── Instagram Card ──

export function InstagramCard({ post }: { post: InstagramPost }) {
  const href = post.permalink?.startsWith("http")
    ? post.permalink
    : post.id
    ? `https://www.instagram.com/p/${post.id}/`
    : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[#E1306C]/10 text-[#E1306C] text-xs font-mono rounded">
          @{post.owner_username}
        </span>
        <span className="text-text-muted text-xs font-mono">{timeAgo(post.timestamp)}</span>
        <svg className="w-3 h-3 text-text-muted/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </div>
      <p className="text-text-primary text-sm mb-3 line-clamp-3 group-hover:text-accent transition-colors">
        {post.caption.slice(0, 120)}{post.caption.length > 120 ? "..." : ""}
      </p>
      <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
        <span>{formatNumber(post.like_count)} likes</span>
        <span>{formatNumber(post.comment_count)} comments</span>
        <span className="uppercase text-text-muted/50">{post.media_type}</span>
      </div>
    </a>
  );
}

// ── TikTok Card ──

export function TikTokCard({ post }: { post: TikTokPost }) {
  const href = post.video_url
    ?? (post.author_name && post.id
      ? `https://www.tiktok.com/@${post.author_name}/video/${post.id}`
      : undefined);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-surface border border-border rounded-lg hover:border-accent/20 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[#00f2ea]/10 text-[#00f2ea] text-xs font-mono rounded">
          @{post.author_name}
        </span>
        <span className="text-text-muted text-xs font-mono">{timeAgo(post.create_time)}</span>
        <svg className="w-3 h-3 text-text-muted/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </div>
      <p className="text-text-primary text-sm mb-3 line-clamp-3 group-hover:text-accent transition-colors">
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
    </a>
  );
}
