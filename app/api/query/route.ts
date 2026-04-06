import { NextRequest } from "next/server";
import { searchReddit, searchInstagram, searchTikTok } from "@/lib/stablesocial";
import { getMockReddit, getMockInstagram, getMockTikTok } from "@/lib/mockData";
import { summarize } from "@/lib/summarize";
import { computeAttentionScore } from "@/lib/score";
import type { RedditResult, InstagramResult, TikTokResult } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function useMock(): boolean {
  return process.env.STABLESOCIAL_MOCK === "true";
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("q");
  if (!keyword || keyword.trim().length === 0) {
    return new Response("Missing ?q= parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      const mock = useMock();
      let totalCost = 0;
      let totalCalls = 0;

      let redditResult: RedditResult = { posts: [], error: true, platform: "reddit" };
      let instagramResult: InstagramResult = { posts: [], tags: [], error: true, platform: "instagram" };
      let tiktokResult: TikTokResult = { posts: [], sounds: [], error: true, platform: "tiktok" };

      if (mock) {
        // Stagger mock results for realistic feel
        await delay(800);
        redditResult = getMockReddit();
        totalCost += 0.06;
        totalCalls += 1;
        send("reddit", {
          ...redditResult,
          cost: 0.06,
          duration_ms: 800,
          mock: true,
        });

        await delay(600);
        instagramResult = getMockInstagram();
        totalCost += 0.12;
        totalCalls += 2;
        send("instagram", {
          ...instagramResult,
          cost: 0.12,
          duration_ms: 1400,
          mock: true,
        });

        await delay(500);
        tiktokResult = getMockTikTok();
        totalCost += 0.12;
        totalCalls += 2;
        send("tiktok", {
          ...tiktokResult,
          cost: 0.12,
          duration_ms: 1900,
          mock: true,
        });
      } else {
        // Fire all three platform searches simultaneously
        const startTime = Date.now();

        const results = await Promise.allSettled([
          (async () => {
            const t = Date.now();
            const r = await searchReddit(keyword);
            // Reddit: 1 search + up to 2 post-comments = up to 3 calls
            const calls = r.error ? 0 : 1 + Math.min(r.posts.filter(p => (p.top_comments?.length ?? 0) > 0).length, 2);
            const cost = calls * 0.06;
            totalCost += cost;
            totalCalls += calls;
            send("reddit", {
              ...r,
              cost,
              duration_ms: Date.now() - t,
            });
            return r;
          })(),
          (async () => {
            const t = Date.now();
            const r = await searchInstagram(keyword);
            // Instagram: search + search-tags = 2 calls
            const calls = r.error ? 0 : 2;
            const cost = calls * 0.06;
            totalCost += cost;
            totalCalls += calls;
            send("instagram", {
              ...r,
              cost,
              duration_ms: Date.now() - t,
            });
            return r;
          })(),
          (async () => {
            const t = Date.now();
            const r = await searchTikTok(keyword);
            // TikTok: search + search-music = 2 calls
            const calls = r.error ? 0 : 2;
            const cost = calls * 0.06;
            totalCost += cost;
            totalCalls += calls;
            send("tiktok", {
              ...r,
              cost,
              duration_ms: Date.now() - t,
            });
            return r;
          })(),
        ]);

        // Check if ALL platforms failed — fall back to mock
        const allFailed = results.every(
          (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error)
        );

        if (allFailed) {
          redditResult = getMockReddit();
          instagramResult = getMockInstagram();
          tiktokResult = getMockTikTok();
          totalCost = 0;
          totalCalls = 0;
          send("reddit", { ...redditResult, cost: 0, duration_ms: 0, mock: true });
          send("instagram", { ...instagramResult, cost: 0, duration_ms: 0, mock: true });
          send("tiktok", { ...tiktokResult, cost: 0, duration_ms: 0, mock: true });
        } else {
          if (results[0].status === "fulfilled") redditResult = results[0].value;
          if (results[1].status === "fulfilled") instagramResult = results[1].value;
          if (results[2].status === "fulfilled") tiktokResult = results[2].value;
        }
      }

      // Compute score and summarize
      try {
        const score = computeAttentionScore({
          reddit: redditResult.posts,
          instagram: instagramResult.posts,
          tiktok: tiktokResult.posts,
        });

        const summaryBase = await summarize({
          keyword,
          reddit: redditResult,
          instagram: instagramResult,
          tiktok: tiktokResult,
        });

        send("summary", {
          ...summaryBase,
          score,
          totalCost: Math.round(totalCost * 100) / 100,
          totalCalls,
        });
      } catch (err) {
        console.error("Summary generation failed:", err);
        send("summary", {
          themes: ["summary unavailable"],
          sentiment: "mixed",
          sentimentBreakdown: { reddit: "mixed", instagram: "mixed", tiktok: "mixed" },
          platformVoices: {
            reddit: "Summary generation failed.",
            instagram: "Summary generation failed.",
            tiktok: "Summary generation failed.",
          },
          notableQuote: "",
          risingOrFading: "stable",
          score: 0,
          totalCost: Math.round(totalCost * 100) / 100,
          totalCalls,
        });
      }

      send("done", {});

      if (!closed) {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
