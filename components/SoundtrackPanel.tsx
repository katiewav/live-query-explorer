"use client";

import type { SoundResult } from "@/types";

interface SoundtrackPanelProps {
  sounds: SoundResult[];
  keyword: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function SoundtrackPanel({ sounds, keyword }: SoundtrackPanelProps) {
  if (sounds.length === 0) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-[#00f2ea]/5 via-surface to-[#ff0050]/5 border border-[#00f2ea]/20 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">♫</span>
        <div>
          <h3 className="text-text-primary font-mono text-sm font-medium">
            Trending sounds in posts about {keyword}
          </h3>
          <p className="text-text-muted text-xs font-mono italic">
            Based on sampled posts only
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sounds.map((sound, i) => (
          <div
            key={sound.id || i}
            className="flex items-center justify-between p-3 bg-bg/50 rounded-lg border border-border hover:border-[#00f2ea]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-accent font-mono text-sm font-bold w-6 text-right">
                {i + 1}
              </span>
              <div>
                <p className="text-text-primary text-sm font-mono">{sound.title}</p>
                <p className="text-text-muted text-xs">{sound.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
              {sound.play_count ? (
                <span>{formatNumber(sound.play_count)} plays</span>
              ) : null}
              {sound.video_count ? (
                <span>{formatNumber(sound.video_count)} videos</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
