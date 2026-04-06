import Anthropic from "@anthropic-ai/sdk";
import type {
  RedditResult,
  InstagramResult,
  TikTokResult,
  SummaryPayload,
} from "@/types";

interface SummarizeInput {
  keyword: string;
  reddit: RedditResult;
  instagram: InstagramResult;
  tiktok: TikTokResult;
}

export async function summarize(input: SummarizeInput): Promise<Omit<SummaryPayload, "score" | "totalCost" | "totalCalls">> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackSummary(input);
  }

  const client = new Anthropic({ apiKey });

  // Build structured prompt from post data
  const redditDigest = input.reddit.posts.slice(0, 10).map((p) => {
    const comments = (p.top_comments ?? [])
      .slice(0, 3)
      .map((c) => `  - [${c.score}pts] ${c.body.slice(0, 100)}`)
      .join("\n");
    return `[r/${p.subreddit}] "${p.title}" (${p.score}pts, ${p.num_comments} comments)\n${p.selftext.slice(0, 150)}\n${comments}`;
  }).join("\n\n");

  const instagramDigest = input.instagram.posts.slice(0, 10).map((p) =>
    `[@${p.owner_username}] ${p.caption.slice(0, 120)} (${p.like_count} likes, ${p.comment_count} comments)`
  ).join("\n");

  const tiktokDigest = input.tiktok.posts.slice(0, 10).map((p) =>
    `[@${p.author_name}] ${p.desc.slice(0, 120)} (${p.digg_count} likes, ${p.play_count} views, ${p.comment_count} comments)`
  ).join("\n");

  const userPrompt = `Query: "${input.keyword}"

REDDIT (${input.reddit.posts.length} posts sampled):
${redditDigest || "No results"}

INSTAGRAM (${input.instagram.posts.length} posts sampled):
${instagramDigest || "No results"}
Top tags: ${input.instagram.tags.join(", ") || "none"}

TIKTOK (${input.tiktok.posts.length} posts sampled):
${tiktokDigest || "No results"}

Return JSON matching this exact schema:
{
  "themes": ["string, 3-5 items, each max 8 words"],
  "sentiment": "positive | mixed | negative",
  "sentimentBreakdown": { "reddit": "...", "instagram": "...", "tiktok": "..." },
  "platformVoices": { "reddit": "one sentence", "instagram": "one sentence", "tiktok": "one sentence" },
  "notableQuote": "best actual quote from the data, max 20 words",
  "risingOrFading": "rising | fading | stable"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: "You are a cynical data analyst. Given sampled social media posts, extract what people actually think. Be terse, editorial, and precise. No marketing language. Return only valid JSON.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip markdown fences if present
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Summarize failed:", err);
    return fallbackSummary(input);
  }
}

function fallbackSummary(input: SummarizeInput): Omit<SummaryPayload, "score" | "totalCost" | "totalCalls"> {
  const hasPosts = input.reddit.posts.length + input.instagram.posts.length + input.tiktok.posts.length;
  return {
    themes: hasPosts > 0
      ? ["active discussion online", "mixed reactions", "growing visibility"]
      : ["limited data available"],
    sentiment: "mixed",
    sentimentBreakdown: {
      reddit: input.reddit.posts.length > 0 ? "mixed" : "mixed",
      instagram: input.instagram.posts.length > 0 ? "positive" : "mixed",
      tiktok: input.tiktok.posts.length > 0 ? "mixed" : "mixed",
    },
    platformVoices: {
      reddit: input.reddit.posts.length > 0
        ? "Reddit is debating the merits with typical thoroughness."
        : "Reddit returned no results for this query.",
      instagram: input.instagram.posts.length > 0
        ? "Instagram is showcasing aspirational content around this topic."
        : "Instagram returned no results for this query.",
      tiktok: input.tiktok.posts.length > 0
        ? "TikTok is reacting with short-form takes and sound-driven content."
        : "TikTok returned no results for this query.",
    },
    notableQuote: input.reddit.posts[0]?.title?.slice(0, 80) ?? "No notable quotes in this sample.",
    risingOrFading: "stable",
  };
}
