"use client";

interface PlatformStatus {
  platform: string;
  done: boolean;
  error: boolean;
}

interface LoadingStreamProps {
  statuses: PlatformStatus[];
}

export default function LoadingStream({ statuses }: LoadingStreamProps) {
  const allDone = statuses.every((s) => s.done);
  if (allDone) return null;

  return (
    <div className="space-y-3 mb-8">
      {statuses.map((s) => (
        <div
          key={s.platform}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
            s.done
              ? s.error
                ? "bg-negative/5 border-negative/20"
                : "bg-positive/5 border-positive/20"
              : "bg-surface border-border"
          }`}
        >
          {s.done ? (
            <span className={`w-2 h-2 rounded-full ${s.error ? "bg-negative" : "bg-positive"}`} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
          <span className="font-mono text-sm text-text-primary capitalize">
            {s.done
              ? s.error
                ? `${s.platform} failed`
                : `${s.platform} loaded`
              : `Fetching ${s.platform}...`}
          </span>
          {!s.done && (
            <svg
              className="w-4 h-4 text-text-muted animate-spin ml-auto"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="32"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
