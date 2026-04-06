"use client";

import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";

const suggestions = [
  { label: "#loewe", query: "loewe" },
  { label: "bottega veneta", query: "bottega veneta" },
  { label: "dune part two", query: "dune part two" },
  { label: "sabrina carpenter", query: "sabrina carpenter" },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-3xl">
        <h1 className="font-mono text-accent text-sm mb-12 tracking-widest uppercase">
          Live Query Explorer
        </h1>

        <SearchBar />

        <div className="flex flex-wrap gap-2 mt-8">
          {suggestions.map((s) => (
            <button
              key={s.query}
              onClick={() => router.push(`/q/${encodeURIComponent(s.query)}`)}
              className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-mono text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
