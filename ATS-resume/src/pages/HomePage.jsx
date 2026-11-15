import {
  CheckCircle2,
  FileSearch,
  Gauge,
  ListChecks,
  Lock,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing.jsx';

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload your PDF',
    text: 'Add your resume. ResumeIQ reads the text in your browser, so the PDF file itself is never uploaded.',
  },
  {
    icon: FileSearch,
    title: 'Paste the job description',
    text: 'Add the full posting so the analysis compares your resume with the exact requirements.',
  },
  {
    icon: ListChecks,
    title: 'Review your report',
    text: 'See your score, missing keywords, and a prioritized list of changes to make.',
  },
];

const FEATURES = [
  {
    icon: Gauge,
    title: 'ATS score',
    text: 'A 0 to 100 score built from a published rubric covering skills, experience, education, projects, keywords, and formatting.',
  },
  {
    icon: Search,
    title: 'Keyword gap analysis',
    text: 'Find the job description terms your resume already uses, and the important ones it is missing.',
  },
  {
    icon: Target,
    title: 'Skills match',
    text: 'Matching, partial, and missing skills, so you know exactly where you stand.',
  },
  {
    icon: FileSearch,
    title: 'Section-by-section review',
    text: 'Ratings and feedback for your summary, experience, education, technical skills, and projects.',
  },
  {
    icon: ListChecks,
    title: 'Prioritized fixes',
    text: 'Ranked actions you can apply today. Nothing is invented: suggestions use only what your resume says.',
  },
  {
    icon: Printer,
    title: 'Printable report',
    text: 'Print the dashboard or save it as a PDF to share or keep for later.',
  },
];

const BENEFITS = [
  'See the gaps between your resume and the role before you apply',
  'Use the exact language the employer put in the posting',
  'Stop guessing which skills and keywords matter most',
  'Strengthen weak sections without adding experience you do not have',
];

const PREVIEW_ACTIONS = [
  { priority: 'High', text: 'Name your React and testing tools in the skills section' },
  { priority: 'Medium', text: 'Add the employer term "accessibility" where your work supports it' },
];

function Bar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
      <div className="bar-fill h-full rounded-full" style={{ width: `${value}%` }} />
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg rise" style={{ animationDelay: '150ms' }} aria-hidden="true">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/35 via-blue/15 to-transparent blur-3xl" />
      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
          <span className="ml-3 text-xs text-muted">ResumeIQ · Example report</span>
        </div>

        <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr]">
          <ScoreRing score={84} size={150} stroke={12} label="Example ATS score" />
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Skills match</span>
                <span className="font-semibold text-ink">78%</span>
              </div>
              <Bar value={78} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Keywords found</span>
                <span className="font-semibold text-ink">12 of 15</span>
              </div>
              <Bar value={80} />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-accent/15 text-glow">React</span>
              <span className="chip bg-accent/15 text-glow">JavaScript</span>
              <span className="chip border border-dashed border-line text-ink">Vitest</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-line p-6">
          {PREVIEW_ACTIONS.map((a) => (
            <div key={a.text} className="flex items-start gap-3 rounded-xl bg-surface/60 p-3.5">
              <span
                className={`chip shrink-0 ${a.priority === 'High' ? 'bg-accent text-white' : 'bg-blue/15 text-blue'}`}
              >
                {a.priority}
              </span>
              <span className="text-sm leading-relaxed text-ink/90">{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ onStart }) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -left-24 top-16 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div
            className="animate-blob absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-blue/20 blur-3xl"
            style={{ animationDelay: '-6s' }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <div className="rise">
            <p className="eyebrow">
              <Lock className="h-3.5 w-3.5 text-glow" aria-hidden="true" />
              Your resume is never stored by ResumeIQ
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Make your resume <span className="gradient-text">ATS-ready</span> with AI
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Upload your PDF resume and paste a job description. ResumeIQ scores how well you match the role and shows
              the keywords, skills, and fixes that will make your application stronger.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <button type="button" onClick={onStart} className="btn-primary">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload Resume
              </button>
              <a href="#how-it-works" className="btn-secondary">
                See how it works
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" />
                PDF, up to 5 MB
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" />
                Scored on a published rubric
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" />
                Printable report
              </li>
            </ul>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title mt-5">From upload to action plan in three steps</h2>
          <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
            No account and no setup. Start with your resume and the job posting you want.
          </p>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card relative p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-blue text-white shadow-glow">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-3xl font-semibold text-line">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <p className="eyebrow">Features</p>
          <h2 className="section-title mt-5">Everything you need in one report</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="card group p-7 transition duration-300 hover:-translate-y-1 hover:border-glow/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-glow ring-1 ring-inset ring-glow/20 transition group-hover:bg-accent/25">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">Benefits</p>
            <h2 className="section-title mt-5">Apply with a resume that matches the role</h2>
          </div>
          <ul className="card space-y-5 p-7 sm:p-9">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-base leading-relaxed text-ink/90">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
                {benefit}
              </li>
            ))}
            <li className="flex gap-3 border-t border-line pt-5 text-sm leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-glow" aria-hidden="true" />
              Scores are estimates from a published rubric. They do not guarantee interviews or any employer's screening
              result.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-[#4f6bff] to-blue px-8 py-12 text-white shadow-glow sm:px-12 sm:py-14">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Find out where your resume stands
              </h2>
              <p className="mt-3 max-w-lg text-white/85">
                Upload your resume and paste the job description. Your report appears after a short analysis.
              </p>
            </div>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-white/95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Upload Resume
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
