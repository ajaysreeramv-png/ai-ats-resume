import { useState } from 'react';
import { generateSampleResume } from '../services/sampleResumeService.js';
import { downloadSampleResumePdf } from '../utils/downloadSampleResumePdf.js';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FileSearch,
  FileText,
  Download,
  Loader2,
  Gauge,
  Info,
  Lightbulb,
  ListChecks,
  Printer,
  RotateCcw,
  Search,
  Target,
} from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';

const PRIORITY_STYLES = {
  High: 'bg-accent text-white',
  Medium: 'bg-blue/15 text-blue',
  Low: 'bg-surface text-muted',
};

const QUALITY_SECTIONS = [
  ['summary', 'Professional summary'],
  ['experience', 'Experience'],
  ['education', 'Education'],
  ['technicalSkills', 'Technical skills'],
  ['projects', 'Projects'],
];

function Panel({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`card print-card p-6 sm:p-7 ${className}`}>
      <h2 className="flex items-center gap-2.5 text-base font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-glow">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bar({ value, max = 100 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="bar-fill h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Ten-segment meter for 1 to 10 ratings.
function Segments({ value, max = 10 }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i < value ? 'bar-fill' : 'bg-surface'}`}
          style={{ transitionDelay: `${i * 35}ms` }}
        />
      ))}
    </div>
  );
}

function Chips({ items, variant, empty }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const styles = {
    found: 'bg-accent/15 text-glow',
    partial: 'bg-blue/15 text-blue',
    missing: 'border border-dashed border-muted/50 text-ink',
  };
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className={`chip ${styles[variant]}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Bullets({ items, icon: Icon, iconClass, empty }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex gap-3 text-sm leading-relaxed text-ink/90">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }) {
  return <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{children}</h3>;
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-glow">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export default function ResultsDashboard({ analysis: a, resumeText, onReset }) {
  const [sampleResume, setSampleResume] = useState(null);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [sampleError, setSampleError] = useState('');

  async function handleGenerateSample() {
    if (generatingSample || sampleResume) return;
    setGeneratingSample(true);
    setSampleError('');
    try {
      const generated = await generateSampleResume({ resumeText, analysis: a });
      setSampleResume(generated);
    } catch (error) {
      setSampleError(error.message || 'Could not generate the sample resume. Please try again.');
    } finally {
      setGeneratingSample(false);
    }
  }

  const highPriority = a.recommendedActions.filter((r) => r.priority === 'High').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Analysis complete</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Your ATS report</h1>
          <p className="mt-2 text-sm text-muted">Scores are estimates based on the job description you provided.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleGenerateSample} disabled={generatingSample || !resumeText} className="btn-primary">
            {generatingSample ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
            {generatingSample ? 'Generating sample...' : sampleResume ? 'Sample resume generated' : 'Generate sample resume'}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print or save as PDF
          </button>
          <button type="button" onClick={onReset} className="btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Analyze another resume
          </button>
        </div>
      </div>

      {sampleError && (
        <p role="alert" className="no-print mt-6 rounded-xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad">
          {sampleError}
        </p>
      )}

      {sampleResume && (
        <section className="card mt-8 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">AI-generated draft</p>
              <h2 className="mt-3 font-display text-2xl font-semibold">Your sample resume is ready</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Review every detail before using it. This draft is based on your uploaded resume and analysis; it does not add missing skills or qualifications.
              </p>
            </div>
            <button type="button" onClick={() => downloadSampleResumePdf(sampleResume)} className="btn-primary no-print shrink-0">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download sample PDF
            </button>
          </div>
          <div className="mt-7 rounded-xl border border-line bg-white p-6 text-slate-800 sm:p-8">
            <h3 className="text-2xl font-bold">{sampleResume.fullName || 'Sample Resume'}</h3>
            {sampleResume.headline && <p className="mt-1 text-sm font-semibold text-indigo-700">{sampleResume.headline}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {[sampleResume.contact?.email, sampleResume.contact?.phone, sampleResume.contact?.location, ...(sampleResume.contact?.links || [])].filter(Boolean).join(' | ')}
            </p>
            {sampleResume.summary && <><h4 className="mt-6 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Professional Summary</h4><p className="mt-2 whitespace-pre-line text-sm">{sampleResume.summary}</p></>}
            {sampleResume.skills?.length > 0 && <><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Skills</h4><p className="mt-2 text-sm">{sampleResume.skills.join(' • ')}</p></>}
            {sampleResume.experience?.length > 0 && <><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Experience</h4>{sampleResume.experience.map((item, i) => <div key={i} className="mt-3"><p className="text-sm font-semibold">{[item.role, item.company].filter(Boolean).join(' | ')}</p>{item.dates && <p className="text-xs text-slate-500">{item.dates}</p>}<ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{(item.bullets || []).map((bullet, j) => <li key={j}>{bullet}</li>)}</ul></div>)}</>}
            {sampleResume.projects?.length > 0 && <><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Projects</h4>{sampleResume.projects.map((item, i) => <div key={i} className="mt-3"><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-sm">{item.description}</p>{item.technologies && <p className="mt-1 text-xs text-slate-500">Technologies: {item.technologies}</p>}</div>)}</>}
            {sampleResume.education?.length > 0 && <><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Education</h4>{sampleResume.education.map((item, i) => <div key={i} className="mt-3"><p className="text-sm font-semibold">{[item.degree, item.institution].filter(Boolean).join(' | ')}</p>{item.dates && <p className="text-xs text-slate-500">{item.dates}</p>}{item.details && <p className="mt-1 text-sm">{item.details}</p>}</div>)}</>}
            {sampleResume.certifications?.length > 0 && <><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Certifications</h4><ul className="mt-2 list-disc pl-5 text-sm">{sampleResume.certifications.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
            {(sampleResume.additionalSections || []).map((section, i) => <div key={i}><h4 className="mt-5 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-indigo-700">{section.title}</h4><p className="mt-2 whitespace-pre-line text-sm">{section.items}</p></div>)}
          </div>
        </section>
      )}

      {/* Summary stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label="ATS score" value={`${a.atsScore} / 100`} sub="Rubric total" />
        <StatCard icon={Target} label="Skills match" value={`${a.skillsMatch.matchPercentage}%`} sub={`${a.skillsMatch.missing.length} missing skills`} />
        <StatCard icon={Search} label="Keywords found" value={a.keywords.found.length} sub={`${a.keywords.missing.length} missing`} />
        <StatCard icon={ListChecks} label="High-priority actions" value={highPriority} sub={`${a.recommendedActions.length} actions in total`} />
      </div>

      {/* Score overview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card print-card flex flex-col items-center p-6 text-center sm:p-7">
          <h2 className="flex w-full items-center gap-2.5 text-base font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-glow">
              <Gauge className="h-4 w-4" aria-hidden="true" />
            </span>
            Overall ATS score
          </h2>
          <div className="mt-6">
            <ScoreRing score={a.atsScore} size={200} stroke={14} />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted">{a.scoreExplanation}</p>
          <div className="mt-6 w-full text-left">
            <div className="flex justify-between text-sm">
              <span>Skills match</span>
              <span className="font-semibold tabular-nums">{a.skillsMatch.matchPercentage}%</span>
            </div>
            <div className="mt-2">
              <Bar value={a.skillsMatch.matchPercentage} />
            </div>
          </div>
        </section>

        <Panel icon={ListChecks} title="How your score was calculated" className="lg:col-span-2">
          <ul className="space-y-6">
            {a.scoreBreakdown.map((b) => (
              <li key={b.category}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className="tabular-nums text-muted">
                    {b.awardedPoints} / {b.maxPoints}
                  </span>
                </div>
                <div className="mt-2">
                  <Bar value={b.awardedPoints} max={b.maxPoints} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.reason}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Skills and keywords */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel icon={Target} title="Skills match">
          <div className="space-y-7">
            <div>
              <SubHeading>Matching skills</SubHeading>
              <Chips items={a.skillsMatch.matching} variant="found" empty="No clear matches found." />
            </div>
            <div>
              <SubHeading>Partially matching</SubHeading>
              {a.skillsMatch.partial.length ? (
                <ul className="space-y-3">
                  {a.skillsMatch.partial.map((p, i) => (
                    <li key={`${p.skill}-${i}`} className="text-sm leading-relaxed">
                      <span className="chip bg-blue/15 text-blue">{p.skill}</span>
                      {p.note && <span className="mt-1.5 block text-muted sm:ml-2 sm:mt-0 sm:inline">{p.note}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None identified.</p>
              )}
            </div>
            <div>
              <SubHeading>Missing skills</SubHeading>
              <Chips items={a.skillsMatch.missing} variant="missing" empty="No missing skills identified." />
            </div>
          </div>
        </Panel>

        <Panel icon={FileSearch} title="Keyword analysis">
          <div className="space-y-7">
            <p className="text-sm text-muted">
              {a.keywords.important.length} important keywords identified in the job description.
            </p>
            <div>
              <SubHeading>Keywords found in your resume</SubHeading>
              <Chips items={a.keywords.found} variant="found" empty="None found." />
            </div>
            <div>
              <SubHeading>Missing keywords</SubHeading>
              <Chips items={a.keywords.missing} variant="missing" empty="No missing keywords. Nice work." />
            </div>
          </div>
        </Panel>
      </div>

      {/* Strengths and gaps */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel icon={Briefcase} title="Job compatibility">
          <p className="text-sm leading-relaxed text-ink/90">{a.jobMatch.overallExplanation}</p>
        </Panel>
        <div className="card print-card grid gap-6 p-6 sm:grid-cols-2 sm:p-7">
          <div>
            <SubHeading>Strengths</SubHeading>
            <Bullets items={a.jobMatch.strengths} icon={CheckCircle2} iconClass="text-ok" empty="No strengths identified." />
          </div>
          <div>
            <SubHeading>Gaps</SubHeading>
            <Bullets items={a.jobMatch.gaps} icon={AlertTriangle} iconClass="text-warn" empty="No major gaps identified." />
          </div>
        </div>
      </div>

      {/* Resume quality */}
      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Resume quality</h2>
        <p className="mt-2 text-sm text-muted">Each section is rated from 1 to 10.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {QUALITY_SECTIONS.map(([key, label]) => {
            const section = a.resumeQuality[key];
            return (
              <section key={key} className="card print-card p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold">{label}</h3>
                  <span className="tabular-nums text-sm font-semibold">
                    {section.rating}
                    <span className="font-normal text-muted"> / 10</span>
                  </span>
                </div>
                <div className="mt-4">
                  <Segments value={section.rating} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{section.assessment}</p>
              </section>
            );
          })}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Improvement suggestions</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel icon={Lightbulb} title="Recommended changes" className="lg:col-span-1">
            <Bullets items={a.suggestions.improvements} icon={CheckCircle2} iconClass="text-glow" empty="No changes suggested." />
          </Panel>
          <Panel icon={Info} title="Missing information">
            <Bullets items={a.suggestions.missingInformation} icon={Info} iconClass="text-blue" empty="Nothing obvious is missing." />
          </Panel>
          <Panel icon={FileSearch} title="Formatting and readability">
            <Bullets items={a.suggestions.formatting} icon={Info} iconClass="text-blue" empty="Formatting looks clean." />
          </Panel>
        </div>
      </div>

      {/* Recommended actions */}
      <Panel icon={ListChecks} title="Prioritized recommendations" className="mt-14">
        <ol className="space-y-3">
          {a.recommendedActions.map((item, i) => (
            <li
              key={`${item.action}-${i}`}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface/40 p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <div className="flex items-center gap-3 sm:w-36 sm:shrink-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
                  {i + 1}
                </span>
                <span className={`chip ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
              </div>
              <span className="text-sm leading-relaxed text-ink/90">{item.action}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <p className="mt-12 text-center text-xs leading-relaxed text-muted">
        This report estimates how well your resume matches this job description. It is not a guarantee of selection and
        does not reproduce any employer's ATS.
      </p>
    </div>
  );
}
