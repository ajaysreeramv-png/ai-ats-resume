import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';

const SECTIONS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'benefits', label: 'Benefits' },
];

export default function Navbar({ page, onNavigate, onSection }) {
  const [open, setOpen] = useState(false);
  const isHome = page === 'home';

  const goHome = () => {
    setOpen(false);
    onNavigate('home');
  };
  const goAnalyze = () => {
    setOpen(false);
    onNavigate('analyze');
  };
  const goSection = (id) => {
    setOpen(false);
    onSection(id);
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-navy/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <button
          type="button"
          onClick={goHome}
          aria-label="ResumeIQ home"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue/40"
        >
          <Logo />
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {isHome &&
            SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goSection(s.id)}
                className="text-sm font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/50 rounded"
              >
                {s.label}
              </button>
            ))}
          {!isHome && (
            <button
              type="button"
              onClick={goHome}
              className="text-sm font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/50 rounded"
            >
              Home
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={goAnalyze} className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
            Analyze Resume
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-ink transition hover:bg-white/5 md:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue/40"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-navy/95 px-4 pb-6 pt-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {isHome &&
              SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goSection(s.id)}
                  className="rounded-xl px-3 py-3 text-left text-base font-medium text-ink transition hover:bg-white/5"
                >
                  {s.label}
                </button>
              ))}
            {!isHome && (
              <button
                type="button"
                onClick={goHome}
                className="rounded-xl px-3 py-3 text-left text-base font-medium text-ink transition hover:bg-white/5"
              >
                Home
              </button>
            )}
          </div>
          <button type="button" onClick={goAnalyze} className="btn-primary mt-4 w-full">
            Analyze Resume
          </button>
        </div>
      )}
    </header>
  );
}
