import { useRef, useState } from 'react';
import { AlertCircle, Check, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import UploadZone from '../components/UploadZone.jsx';
import JobDescriptionInput from '../components/JobDescriptionInput.jsx';
import ResultsDashboard from '../components/ResultsDashboard.jsx';
import AnalysisProgress from '../components/AnalysisProgress.jsx';
import { extractPdfText, PdfError } from '../utils/pdfExtract.js';
import { analyzeResume } from '../services/analyzeService.js';
import { LIMITS } from '../../lib/limits.js';

export default function AnalyzerPage() {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Guards against double submissions and stale PDF reads.
  const busyRef = useRef(false);
  const readId = useRef(0);

  async function handleFileSelected(selected) {
    const id = ++readId.current;
    setUploadError('');
    setFormError('');
    setResumeText('');
    setFile(selected);
    setExtracting(true);

    try {
      const text = await extractPdfText(selected);
      if (id === readId.current) setResumeText(text);
    } catch (err) {
      if (id === readId.current) {
        setFile(null);
        setUploadError(err instanceof PdfError ? err.message : 'Something went wrong while reading the PDF. Try again.');
      }
    } finally {
      if (id === readId.current) setExtracting(false);
    }
  }

  function handleRemoveFile() {
    readId.current += 1;
    setFile(null);
    setResumeText('');
    setExtracting(false);
    setUploadError('');
  }

  async function handleAnalyze() {
    if (busyRef.current) return;

    const jd = jobDescription.trim();
    if (!resumeText) {
      setFormError('Upload a PDF resume before analyzing.');
      return;
    }
    if (!jd) {
      setFormError('Paste the job description. It is required for the analysis.');
      return;
    }
    if (jd.length < LIMITS.jdMinChars) {
      setFormError(`The job description needs at least ${LIMITS.jdMinChars} characters.`);
      return;
    }

    setFormError('');
    busyRef.current = true;
    setAnalyzing(true);
    try {
      const { analysis } = await analyzeResume({ resumeText, jobDescription: jd });
      setResult(analysis);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      busyRef.current = false;
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setResult(null);
    setFile(null);
    setResumeText('');
    setJobDescription('');
    setFormError('');
    setUploadError('');
  }

  if (result) {
    return <ResultsDashboard analysis={result} onReset={handleReset} />;
  }

  const ready = Boolean(resumeText) && !extracting && !analyzing;
  const jdReady = jobDescription.trim().length >= LIMITS.jdMinChars;
  const steps = [
    { label: 'Upload resume', done: Boolean(resumeText) },
    { label: 'Add job description', done: jdReady },
    { label: 'Get your report', done: false },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Resume analysis</p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Analyze your resume</h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          Upload your PDF and paste the job description. ResumeIQ scores the match and lists what to improve.
        </p>
      </header>

      <ol className="mt-8 flex flex-wrap gap-3" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${
              s.done ? 'border-ok/40 bg-ok/10 text-ok' : 'border-line bg-surface/40 text-muted'
            }`}
          >
            {s.done ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <span className="font-semibold">{i + 1}</span>
            )}
            <span className="font-medium">{s.label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <UploadZone
          file={file}
          extracting={extracting}
          characters={resumeText.length}
          error={uploadError}
          disabled={analyzing}
          onSelect={handleFileSelected}
          onRemove={handleRemoveFile}
        />
        <JobDescriptionInput value={jobDescription} onChange={setJobDescription} disabled={analyzing} />
      </div>

      {formError && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      {analyzing ? (
        <AnalysisProgress />
      ) : (
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-xl items-start gap-2.5 text-sm leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-glow" aria-hidden="true" />
            Your extracted resume text and job description are sent to an AI model through OpenRouter to create the
            report. ResumeIQ does not store them.
          </p>
          <button type="button" onClick={handleAnalyze} disabled={!ready} className="btn-primary sm:shrink-0">
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Reading PDF
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Analyze resume
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
