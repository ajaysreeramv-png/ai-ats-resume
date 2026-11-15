import { useEffect, useId, useState } from 'react';

// Circular score meter. The number counts up and the arc animates to the score.
export default function ScoreRing({ score, size = 200, stroke = 14, label = 'ATS score' }) {
  const gradientId = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(target);
      return undefined;
    }
    const duration = 1400;
    let start = null;
    let frame = 0;
    setValue(0);
    const tick = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`${label}: ${target} out of 100`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="font-display text-5xl font-semibold tabular-nums text-ink" style={{ fontSize: size * 0.27 }}>
          {value}
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">out of 100</span>
      </div>
    </div>
  );
}
