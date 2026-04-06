"use client";

import { useEffect, useState } from "react";

interface ScoreDisplayProps {
  score: number;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (score === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayed(score);
        clearInterval(interval);
      } else {
        setDisplayed(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [score]);

  return (
    <span className="text-accent font-mono text-7xl font-bold tabular-nums">
      {displayed}
    </span>
  );
}
