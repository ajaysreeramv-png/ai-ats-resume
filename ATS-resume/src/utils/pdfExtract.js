import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { LIMITS } from '../../lib/limits.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export class PdfError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Checks the file before any parsing happens.
export function validatePdfFile(file) {
  if (!file) throw new PdfError('MISSING', 'Choose a PDF resume to upload.');

  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    throw new PdfError('WRONG_TYPE', 'Only PDF files are supported. Export your resume as a PDF and try again.');
  }
  if (file.size === 0) {
    throw new PdfError('EMPTY_FILE', 'This file is empty. Choose a different PDF.');
  }
  if (file.size > LIMITS.maxPdfBytes) {
    throw new PdfError('TOO_LARGE', 'This file is larger than 5 MB. Export a smaller PDF and try again.');
  }
}

// Reads the PDF in the browser with PDF.js. The raw file is never uploaded.
export async function extractPdfText(file) {
  validatePdfFile(file);

  let pdf;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    // Every PDF starts with the bytes "%PDF". Reject other files before parsing.
    if (data[0] !== 0x25 || data[1] !== 0x50 || data[2] !== 0x44 || data[3] !== 0x46) {
      throw new PdfError('CORRUPT', 'This file is not a valid PDF. Export your resume as a PDF and try again.');
    }
    pdf = await pdfjsLib.getDocument({ data }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new PdfError('PASSWORD', 'This PDF is password-protected. Remove the password, then upload it again.');
    }
    if (err instanceof PdfError) throw err;
    throw new PdfError('CORRUPT', 'This PDF could not be read. It may be corrupted or not a valid PDF file.');
  }

  if (pdf.numPages > LIMITS.maxPdfPages) {
    pdf.destroy?.();
    throw new PdfError(
      'TOO_MANY_PAGES',
      `Resumes longer than ${LIMITS.maxPdfPages} pages are not supported. Shorten your resume and try again.`
    );
  }

  let text;
  try {
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // hasEOL marks the end of a visual line, so keep line breaks where the PDF has them.
      pages.push(
        content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join('')
      );
    }
    text = pages
      .join('\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } finally {
    // Release PDF.js memory and worker resources.
    pdf.destroy?.();
  }

  if (text.length < LIMITS.resumeMinChars) {
    throw new PdfError(
      'EMPTY_TEXT',
      'We could not find enough readable text. Scanned or image-only PDFs are not supported. Export a text-based PDF and try again.'
    );
  }

  return text.slice(0, LIMITS.resumeMaxChars);
}
