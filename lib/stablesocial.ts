import { execSync } from "child_process";
import { cacheGet, cacheSet } from "./cache";
import type {
  RedditPost,
  RedditComment,
  InstagramPost,
  TikTokPost,
  SoundResult,
  RedditResult,
  InstagramResult,
  TikTokResult,
} from "@/types";

const BASE = "https://stablesocial.dev";
const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 20;

// ── agentcash CLI wrapper ──

function agentcashPath(): string {
  // npx resolves through PATH; we use execSync for server-side calls
  return "npx agentcash@latest";
}

function npxPrefix(): string {
  // Ensure homebrew node is on PATH for child processes
  return 'export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && ';
}

async function triggerJob(
  endpoint: string,
  body: Record<string, unknown>
): Promise<string> {
  const url = `${BASE}${endpoint}`;
  const bodyStr = JSON.stringify(body).replace(/'/g, "'\\''");
  const cmd = `${npxPrefix()}${agentcashPath()} fetch '${url}' -m POST -b '${bodyStr}' --format json`;

  const raw = execSync(cmd, {
    encoding: "utf-8",
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
  });

  // Parse response — agentcash returns JSON with a data field
  const parsed = JSON.parse(raw);
  const responseData = parsed?.data?.response ?? parsed?.data ?? parsed;

  // The trigger returns 202 with a token
  const token = responseData?.token ?? responseData?.data?.token;
  if (!token) {
    throw new Error(`No token in trigger response for ${endpoint}: ${raw.slice(0, 500)}`);
  }
  return token;
}

async function pollJob(token: string, maxAttempts = MAX_POLL_ATTEMPTS): Promise<unknown> {
  const url = `${BASE}/api/jobs?token=${encodeURIComponent(token)}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cmd = `${npxPrefix()}${agentcashPath()} fetch '${url}' --format json`;

    const raw = execSync(cmd, {
      encoding: "utf-8",
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(raw);
    const jobData = parsed?.data?.response ?? parsed?.data ?? parsed;
    const status = jobData?.status;

    if (status === "finished") {
      return jobData?.data ?? jobData;
    }
    if (status === "failed") {
      throw new Error(`Job failed: ${jobData?.error ?? "unknown error"}`);
    }

    // Wait before next poll
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error(`Job polling timed out after ${maxAttempts} attempts`);
}

async function fetchEndpoint(
  endpoint: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const token = await triggerJob(endpoint, body);
  return pollJob(token);
}

// ── Reddit ──

export async function searchReddit(keyword: string): Promise<RedditResult> {
  const cacheKey = `${keyword}:reddit:search`;
  const cached = await cacheGet<RedditResult>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchEndpoint("/api/reddit/search", {
      keywords: keyword,
      max_posts: 20,
      max_page_size: 20,
    });

    const rawPosts = Array.isArray(data)
      ? data
      : (data as Record<string, unknown>)?.posts ??
        (data as Record<string, unknown>)?.data ??
        [];

    const posts: RedditPost[] = (rawPosts as Record<string, unknown>[]).slice(0, 20).map((p) => ({
      id: String(p.id ?? p.post_id ?? ""),
      title: String(p.title ?? ""),
      selftext: String(p.selftext ?? p.body ?? p.text ?? ""),
      subreddit: String(p.subreddit ?? p.subreddit_name ?? ""),
      score: Number(p.score ?? p.ups ?? 0),
      num_comments: Number(p.num_comments ?? p.comment_count ?? 0),
      created_utc: Number(p.created_utc ?? p.created_at ?? p.timestamp ?? 0),
      permalink: String(p.permalink ?? p.url ?? ""),
      author: String(p.author ?? p.username ?? ""),
      url: String(p.url ?? p.permalink ?? ""),
      top_comments: [],
    }));

    // Chain post-comments for top 2 posts (cost control)
    const topPosts = posts
      .sort((a, b) => b.num_comments - a.num_comments)
      .slice(0, 2);

    await Promise.allSettled(
      topPosts.map(async (post) => {
        try {
          const commentsData = await fetchEndpoint("/api/reddit/post-comments", {
            post_id: post.id,
            max_comments: 10,
          });
          const rawComments = Array.isArray(commentsData)
            ? commentsData
            : (commentsData as Record<string, unknown>)?.comments ?? [];

          post.top_comments = (rawComments as Record<string, unknown>[])
            .slice(0, 5)
            .map((c) => ({
              id: String(c.id ?? ""),
              body: String(c.body ?? c.text ?? ""),
              score: Number(c.score ?? c.ups ?? 0),
              author: String(c.author ?? ""),
              created_utc: Number(c.created_utc ?? c.created_at ?? 0),
            }));
        } catch {
          post.top_comments = [];
        }
      })
    );

    const result: RedditResult = { posts, error: false, platform: "reddit" };
    await cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Reddit search failed:", err);
    return { posts: [], error: true, platform: "reddit" };
  }
}

// ── Instagram ──

export async function searchInstagram(keyword: string): Promise<InstagramResult> {
  const cacheKey = `${keyword}:instagram:search`;
  const cached = await cacheGet<InstagramResult>(cacheKey);
  if (cached) return cached;

  try {
    // Run search and search-tags in parallel
    const [searchResult, tagsResult] = await Promise.allSettled([
      fetchEndpoint("/api/instagram/search", {
        keywords: keyword,
        max_posts: 20,
        max_page_size: 20,
      }),
      fetchEndpoint("/api/instagram/search-tags", {
        tag: keyword.replace(/[^a-zA-Z0-9]/g, ""),
        max_page_size: 20,
      }),
    ]);

    // Process search posts
    let posts: InstagramPost[] = [];
    if (searchResult.status === "fulfilled") {
      const data = searchResult.value;
      const rawPosts = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.posts ??
          (data as Record<string, unknown>)?.data ??
          [];

      posts = (rawPosts as Record<string, unknown>[]).slice(0, 20).map((p) => ({
        id: String(p.id ?? p.post_id ?? p.pk ?? ""),
        caption: String(p.caption ?? p.text ?? p.edge_media_to_caption ?? ""),
        like_count: Number(p.like_count ?? p.likes ?? p.edge_liked_by ?? 0),
        comment_count: Number(p.comment_count ?? p.comments ?? 0),
        timestamp: String(p.timestamp ?? p.taken_at ?? p.created_at ?? new Date().toISOString()),
        permalink: String(p.permalink ?? p.url ?? ""),
        owner_username: String(p.owner_username ?? p.username ?? p.owner ?? ""),
        media_type: String(p.media_type ?? "IMAGE"),
      }));
    }

    // Process tags — merge posts and extract tag names
    let tags: string[] = [];
    if (tagsResult.status === "fulfilled") {
      const data = tagsResult.value;
      const rawTagPosts = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.posts ??
          (data as Record<string, unknown>)?.data ??
          [];

      // Extract hashtags from tag posts captions
      const tagPosts = (rawTagPosts as Record<string, unknown>[]).slice(0, 10);
      const tagSet = new Set<string>();
      for (const p of tagPosts) {
        const caption = String(p.caption ?? p.text ?? "");
        const matches = caption.match(/#(\w+)/g);
        if (matches) matches.forEach((m) => tagSet.add(m.replace("#", "")));
      }
      tags = Array.from(tagSet).slice(0, 15);

      // Deduplicate and merge tag posts
      const existingIds = new Set(posts.map((p) => p.id));
      for (const p of tagPosts) {
        const id = String((p as Record<string, unknown>).id ?? (p as Record<string, unknown>).pk ?? "");
        if (!existingIds.has(id)) {
          posts.push({
            id,
            caption: String((p as Record<string, unknown>).caption ?? ""),
            like_count: Number((p as Record<string, unknown>).like_count ?? 0),
            comment_count: Number((p as Record<string, unknown>).comment_count ?? 0),
            timestamp: String((p as Record<string, unknown>).timestamp ?? new Date().toISOString()),
            permalink: String((p as Record<string, unknown>).permalink ?? ""),
            owner_username: String((p as Record<string, unknown>).owner_username ?? ""),
            media_type: String((p as Record<string, unknown>).media_type ?? "IMAGE"),
          });
          existingIds.add(id);
        }
      }
    }

    if (tags.length === 0) {
      tags = [keyword.replace(/[^a-zA-Z0-9]/g, "")];
    }

    const result: InstagramResult = { posts: posts.slice(0, 20), tags, error: false, platform: "instagram" };
    await cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Instagram search failed:", err);
    return { posts: [], tags: [], error: true, platform: "instagram" };
  }
}

// ── TikTok ──

export async function searchTikTok(keyword: string): Promise<TikTokResult> {
  const cacheKey = `${keyword}:tiktok:search`;
  const cached = await cacheGet<TikTokResult>(cacheKey);
  if (cached) return cached;

  try {
    // Run search and search-music in parallel
    const [searchResult, musicResult] = await Promise.allSettled([
      fetchEndpoint("/api/tiktok/search", {
        keywords: keyword,
        max_posts: 20,
        max_page_size: 20,
      }),
      fetchEndpoint("/api/tiktok/search-music", {
        music_title: keyword,
        max_page_size: 20,
      }),
    ]);

    // Process search posts
    let posts: TikTokPost[] = [];
    if (searchResult.status === "fulfilled") {
      const data = searchResult.value;
      const rawPosts = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.posts ??
          (data as Record<string, unknown>)?.videos ??
          (data as Record<string, unknown>)?.data ??
          [];

      posts = (rawPosts as Record<string, unknown>[]).slice(0, 20).map((p) => ({
        id: String(p.id ?? p.aweme_id ?? p.video_id ?? ""),
        desc: String(p.desc ?? p.description ?? p.title ?? ""),
        digg_count: Number(p.digg_count ?? p.likes ?? p.like_count ?? 0),
        comment_count: Number(p.comment_count ?? p.comments ?? 0),
        play_count: Number(p.play_count ?? p.views ?? p.view_count ?? 0),
        share_count: Number(p.share_count ?? p.shares ?? 0),
        create_time: Number(p.create_time ?? p.created_at ?? p.timestamp ?? 0),
        author_name: String(p.author_name ?? p.author ?? p.nickname ?? ""),
        music_title: String(p.music_title ?? (p.music as Record<string, unknown>)?.title ?? ""),
        music_author: String(p.music_author ?? (p.music as Record<string, unknown>)?.author ?? ""),
      }));
    }

    // Process music/sounds
    let sounds: SoundResult[] = [];
    if (musicResult.status === "fulfilled") {
      const data = musicResult.value;
      const rawSounds = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.sounds ??
          (data as Record<string, unknown>)?.music ??
          (data as Record<string, unknown>)?.data ??
          [];

      sounds = (rawSounds as Record<string, unknown>[]).slice(0, 10).map((s) => ({
        id: String(s.id ?? s.music_id ?? ""),
        title: String(s.title ?? s.music_title ?? ""),
        author: String(s.author ?? s.music_author ?? ""),
        play_count: Number(s.play_count ?? s.user_count ?? 0),
        video_count: Number(s.video_count ?? 0),
      }));
    }

    const result: TikTokResult = { posts, sounds, error: false, platform: "tiktok" };
    await cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    console.error("TikTok search failed:", err);
    return { posts: [], sounds: [], error: true, platform: "tiktok" };
  }
}
