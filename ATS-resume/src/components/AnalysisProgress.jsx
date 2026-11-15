import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

// The server does not stream progress, so this shows estimated progress that
// never claims to be complete before the response arrives.
const STEPS = [
  { label: 'Reading your resume text', until: 3 },
  { label: 'Comparing it with the job description', until: 10 },
  { label: 'Scoring against the ATS rubric', until: 22 },
  { label: 'Checking and preparing your report', until: Infinity },
];

export default function AnalysisProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(id);
  }, []);

  const activeIndex = STEPS.findIndex((s) => elapsed < s.until);
  // Approaches 92% and waits for the real response before reaching 100%.
  const pct = Math.round(92 * (1 - Math.exp(-elapsed / 18)));

  return (
    <section className="card mt-8 p-6 sm:p-7" aria-labelledby="progress-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="progress-heading" className="font-semibold">
            Analyzing your resume
          </h2>
          <p className="mt-1 text-sm text-muted">Estimated progress. Most analyses take 10 to 40 seconds.</p>
        </div>
        <p className="tabular-nums text-sm text-muted">
          {Math.floor(elapsed)}s · {pct}%
        </p>
      </div>

      <div
        className="progress-sheen mt-5 h-2.5 w-full overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label="Estimated analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="bar-fill h-full rounded-full transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  done ? 'bg-ok/15 text-ok' : active ? 'bg-accent/25 text-glow' : 'bg-surface text-muted'
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              <span className={done || active ? 'text-ink' : 'text-muted'}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
