"use client";

import { useEffect, useState } from "react";
import type { SummaryPayload } from "@/types";
import ScoreDisplay from "./ScoreDisplay";

interface SummaryStripProps {
  summary: SummaryPayload;
}

function sentimentColor(s: string): string {
  if (s === "positive") return "text-positive";
  if (s === "negative") return "text-negative";
  return "text-mixed";
}

function sentimentBg(s: string): string {
  if (s === "positive") return "bg-positive/10 border-positive/20";
  if (s === "negative") return "bg-negative/10 border-negative/20";
  return "bg-mixed/10 border-mixed/20";
}

export default function SummaryStrip({ summary }: SummaryStripProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Score + status row */}
      <div className="flex flex-wrap items-end gap-8 mb-8">
        <div>
          <p className="text-text-muted text-xs font-mono italic mb-1" title="Computed from sampled results only — not representative of full platform volume.">
            Sampled Attention Score
          </p>
          <ScoreDisplay score={summary.score} />
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${
              summary.risingOrFading === "rising"
                ? "bg-positive/10 text-positive border-positive/20"
                : summary.risingOrFading === "fading"
                ? "bg-negative/10 text-negative border-negative/20"
                : "bg-surface text-text-muted border-border"
            }`}
          >
            {summary.risingOrFading}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${sentimentBg(summary.sentiment)} ${sentimentColor(summary.sentiment)}`}
          >
            {summary.sentiment}
          </span>
        </div>

        {/* Mini platform bars */}
        <div className="flex items-end gap-2">
          {(["reddit", "instagram", "tiktok"] as const).map((p) => (
            <div key={p} className="flex flex-col items-center gap-1">
              <div
                className="w-6 bg-accent/40 rounded-t"
                style={{
                  height: `${Math.max(
                    8,
                    (summary.sentimentBreakdown[p] === "positive" ? 40 : summary.sentimentBreakdown[p] === "negative" ? 15 : 28)
                  )}px`,
                }}
              />
              <span className="text-[10px] font-mono text-text-muted">{p[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* "What the internet is saying" */}
      <div className="space-y-6">
        <h2 className="text-text-primary font-mono text-lg font-medium">
          What the internet is saying
        </h2>

        {/* Platform voices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["reddit", "instagram", "tiktok"] as const).map((p) => (
            <div key={p} className="p-4 bg-surface border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-medium text-text-primary capitalize">{p}</span>
                <span className={`text-xs font-mono ${sentimentColor(summary.sentimentBreakdown[p])}`}>
                  {summary.sentimentBreakdown[p]}
                </span>
              </div>
              <p className="text-sm text-text-muted">{summary.platformVoices[p]}</p>
            </div>
          ))}
        </div>

        {/* Themes */}
        <div className="flex flex-wrap gap-2">
          {summary.themes.map((theme, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-mono text-text-primary"
            >
              {theme}
            </span>
          ))}
        </div>

        {/* Notable quote */}
        {summary.notableQuote && (
          <blockquote className="border-l-2 border-accent pl-4 py-2 italic text-text-muted text-sm">
            &ldquo;{summary.notableQuote}&rdquo;
          </blockquote>
        )}
      </div>
    </div>
  );
}
