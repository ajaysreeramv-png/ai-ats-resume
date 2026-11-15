import { Lock } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer({ onNavigate }) {
  return (
    <footer className="no-print border-t border-line bg-navy/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            AI resume analysis that shows how closely your resume matches a specific job, with clear, prioritized
            fixes.
          </p>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-sm font-semibold text-ink">Product</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <button type="button" onClick={() => onNavigate('analyze')} className="transition hover:text-ink">
                Analyze resume
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Lock className="h-4 w-4 text-glow" aria-hidden="true" />
            Privacy
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Your PDF is read in your browser and never uploaded. The extracted text and job description are sent to
            an AI model through OpenRouter to create your report. ResumeIQ does not store them.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          © {new Date().getFullYear()} ResumeIQ. Scores are estimates. They do not guarantee interviews, selection, or
          any employer's screening result.
        </p>
      </div>
    </footer>
  );
}
