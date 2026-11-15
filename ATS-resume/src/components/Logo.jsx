import { useId } from 'react';

export default function Logo() {
  const gradientId = useId();
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8B6CFF" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        <path
          d="M12.5 11.5h11l6 6v12a3 3 0 0 1-3 3h-14a3 3 0 0 1-3-3v-15a3 3 0 0 1 3-3z"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="24" r="4.4" fill="none" stroke="#fff" strokeWidth="2.4" />
        <path d="M26.3 27.3l3 3" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Resume<span className="gradient-text">IQ</span>
      </span>
    </span>
  );
}
