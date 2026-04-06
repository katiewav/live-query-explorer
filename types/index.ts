// ── Platform post types ──

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  author: string;
  url: string;
  top_comments?: RedditComment[];
}

export interface RedditComment {
  id: string;
  body: string;
  score: number;
  author: string;
  created_utc: number;
}

export interface InstagramPost {
  id: string;
  caption: string;
  like_count: number;
  comment_count: number;
  timestamp: string;
  permalink: string;
  owner_username: string;
  media_type: string;
  thumbnail_url?: string;
}

export interface TikTokPost {
  id: string;
  desc: string;
  digg_count: number;
  comment_count: number;
  play_count: number;
  share_count: number;
  create_time: number;
  author_name: string;
  music_title?: string;
  music_author?: string;
}

export interface SoundResult {
  id: string;
  title: string;
  author: string;
  play_count?: number;
  video_count?: number;
}

export interface TagResult {
  tag: string;
  post_count?: number;
}

// ── Platform result wrappers ──

export interface RedditResult {
  posts: RedditPost[];
  error: boolean;
  platform: "reddit";
}

export interface InstagramResult {
  posts: InstagramPost[];
  tags: string[];
  error: boolean;
  platform: "instagram";
}

export interface TikTokResult {
  posts: TikTokPost[];
  sounds: SoundResult[];
  error: boolean;
  platform: "tiktok";
}

// ── SSE event payloads ──

export interface PlatformSSEEvent {
  posts: unknown[];
  tags?: string[];
  sounds?: SoundResult[];
  cost: number;
  duration_ms: number;
  error: boolean;
}

export interface SummaryPayload {
  themes: string[];
  sentiment: "positive" | "mixed" | "negative";
  sentimentBreakdown: {
    reddit: "positive" | "mixed" | "negative";
    instagram: "positive" | "mixed" | "negative";
    tiktok: "positive" | "mixed" | "negative";
  };
  platformVoices: {
    reddit: string;
    instagram: string;
    tiktok: string;
  };
  notableQuote: string;
  risingOrFading: "rising" | "fading" | "stable";
  score: number;
  totalCost: number;
  totalCalls: number;
}

// ── Client-side state ──

export type PlatformFilter = "all" | "reddit" | "instagram" | "tiktok";
export type TimeFilter = "all" | "7d" | "24h";

export interface QueryState {
  reddit: { data: RedditResult | null; loading: boolean };
  instagram: { data: InstagramResult | null; loading: boolean };
  tiktok: { data: TikTokResult | null; loading: boolean };
  summary: SummaryPayload | null;
  summaryLoading: boolean;
  totalCost: number;
  totalCalls: number;
  totalDuration: number;
  isMock: boolean;
  done: boolean;
}
