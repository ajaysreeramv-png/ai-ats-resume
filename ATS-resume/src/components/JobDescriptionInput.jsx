import { LIMITS } from '../../lib/limits.js';

export default function JobDescriptionInput({ value, onChange, disabled }) {
  const count = value.length;
  const tooShort = count > 0 && count < LIMITS.jdMinChars;
  const pct = Math.min(100, Math.round((count / LIMITS.jdMaxChars) * 100));

  return (
    <section className="card flex flex-col p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="job-description" className="text-base font-semibold">
          2. Paste the job description
        </label>
        <span className="chip bg-surface text-muted">Required</span>
      </div>
      <p className="mt-1.5 text-sm text-muted">Include responsibilities, required skills, and qualifications.</p>

      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={LIMITS.jdMaxChars}
        rows={12}
        placeholder={
          'Paste the full job posting here.\n\nExample:\nWe are hiring a Frontend Developer with 3+ years of React experience. You will build accessible interfaces, work with REST APIs, and collaborate with designers. Required: JavaScript, React, Tailwind CSS, Git. Preferred: testing with Jest or Vitest.'
        }
        className="mt-6 min-h-[280px] flex-1 resize-y rounded-xl border border-line bg-surface/50 p-4 text-sm leading-relaxed text-ink placeholder:text-muted/70 transition focus:border-glow focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:opacity-60"
      />

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <div className="bar-fill h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-4 text-xs text-muted">
        <span role={tooShort ? 'alert' : undefined} className={tooShort ? 'text-bad' : ''}>
          {tooShort ? `Add at least ${LIMITS.jdMinChars} characters for an accurate analysis.` : ''}
        </span>
        <span aria-live="polite" className="tabular-nums">
          {count.toLocaleString()} / {LIMITS.jdMaxChars.toLocaleString()} characters
        </span>
      </div>
    </section>
  );
}
