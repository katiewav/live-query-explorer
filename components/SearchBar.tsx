"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialValue?: string;
  compact?: boolean;
}

export default function SearchBar({ initialValue = "", compact = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length === 0) return;
      router.push(`/q/${encodeURIComponent(trimmed)}`);
    },
    [query, router]
  );

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search..."
          className="w-full bg-transparent text-text-primary font-mono text-lg outline-none placeholder:text-text-muted"
        />
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="what is the internet saying about..."
        autoFocus
        className="w-full bg-transparent text-text-primary font-mono text-3xl md:text-5xl outline-none placeholder:text-text-muted border-b border-border pb-4 focus:border-accent transition-colors"
      />
      <p className="mt-4 text-text-muted text-sm font-mono">
        Live results across Reddit, Instagram, and TikTok
      </p>
    </form>
  );
}
