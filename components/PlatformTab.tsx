"use client";

import type { PlatformFilter } from "@/types";

interface PlatformTabProps {
  active: PlatformFilter;
  onChange: (tab: PlatformFilter) => void;
}

const tabs: { label: string; value: PlatformFilter }[] = [
  { label: "All", value: "all" },
  { label: "Reddit", value: "reddit" },
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
];

export default function PlatformTab({ active, onChange }: PlatformTabProps) {
  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
            active === tab.value
              ? "bg-accent text-black"
              : "bg-surface text-text-muted hover:text-text-primary border border-border"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
