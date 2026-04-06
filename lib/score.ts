import type { RedditPost, InstagramPost, TikTokPost } from "@/types";

interface ScoreInput {
  reddit: RedditPost[];
  instagram: InstagramPost[];
  tiktok: TikTokPost[];
}

export function computeAttentionScore(input: ScoreInput): number {
  const allEngagements: number[] = [];
  const allCommentCounts: number[] = [];
  const postTimestamps: number[] = [];
  let platformsWithResults = 0;

  const now = Date.now() / 1000;
  const fortyEightHoursAgo = now - 48 * 3600;

  // Reddit
  if (input.reddit.length > 0) {
    platformsWithResults++;
    for (const p of input.reddit) {
      allEngagements.push(p.score + p.num_comments);
      allCommentCounts.push(p.num_comments);
      postTimestamps.push(p.created_utc);
    }
  }

  // Instagram
  if (input.instagram.length > 0) {
    platformsWithResults++;
    for (const p of input.instagram) {
      allEngagements.push(p.like_count + p.comment_count);
      allCommentCounts.push(p.comment_count);
      const ts = new Date(p.timestamp).getTime() / 1000;
      if (!isNaN(ts)) postTimestamps.push(ts);
    }
  }

  // TikTok
  if (input.tiktok.length > 0) {
    platformsWithResults++;
    for (const p of input.tiktok) {
      allEngagements.push(p.digg_count + p.comment_count);
      allCommentCounts.push(p.comment_count);
      postTimestamps.push(p.create_time);
    }
  }

  if (allEngagements.length === 0) return 0;

  // Normalized engagement: mean / max
  const maxEng = Math.max(...allEngagements, 1);
  const meanEng = allEngagements.reduce((a, b) => a + b, 0) / allEngagements.length;
  const normalizedEngagement = Math.min(meanEng / maxEng, 1);

  // Discussion intensity: avg comments normalized 0-1 (cap at 50)
  const avgComments =
    allCommentCounts.reduce((a, b) => a + b, 0) / allCommentCounts.length;
  const discussionIntensity = Math.min(avgComments / 50, 1);

  // Recency: % of posts from last 48h
  const recentCount = postTimestamps.filter((t) => t >= fortyEightHoursAgo).length;
  const recencyWeight = postTimestamps.length > 0 ? recentCount / postTimestamps.length : 0;

  // Cross-platform consistency: 0.33 per platform
  const crossPlatform = platformsWithResults * 0.33;

  const raw =
    0.4 * normalizedEngagement +
    0.3 * discussionIntensity +
    0.2 * recencyWeight +
    0.1 * Math.min(crossPlatform, 1);

  return Math.round(raw * 100);
}
