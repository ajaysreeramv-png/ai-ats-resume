import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function UploadZone({ file, extracting, characters = 0, error, disabled, onSelect, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (selected) => {
    if (selected && !disabled) onSelect(selected);
  };

  return (
    <section className="card flex flex-col p-6 sm:p-7" aria-labelledby="upload-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="upload-heading" className="text-base font-semibold">
          1. Upload your resume
        </h2>
        <span className="chip bg-surface text-muted">PDF · up to 5 MB</span>
      </div>
      <p className="mt-1.5 text-sm text-muted">Use a text-based PDF. Scanned images cannot be read.</p>

      {file ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface/50 p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-glow">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5 text-sm text-muted">{formatSize(file.size)} · PDF</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Remove file"
              className="rounded-full p-2.5 text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue/40 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm" aria-live="polite">
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-glow" aria-hidden="true" />
                <span className="text-muted">Reading PDF in your browser…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" />
                <span className="font-medium text-ok">Text extracted</span>
                <span className="text-muted">· {characters.toLocaleString()} characters</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition duration-200 ${
            dragging ? 'border-glow bg-accent/15' : 'border-line bg-surface/40 hover:border-glow/50'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-blue text-white shadow-glow">
            <UploadCloud className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-5 font-semibold">{dragging ? 'Drop your PDF here' : 'Drag and drop your resume'}</p>
          <p className="mt-1 text-sm text-muted">or choose a PDF from your device</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="btn-secondary mt-6 !py-2.5"
          >
            Browse files
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3.5 text-sm text-bad">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </section>
  );
}
