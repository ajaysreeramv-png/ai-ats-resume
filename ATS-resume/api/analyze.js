import { LIMITS } from '../lib/limits.js';
import { DEFAULT_MODEL } from '../lib/openrouter.js';
import { runAnalysis, toAiError } from '../lib/runAnalysis.js';

// POST /api/analyze. Never log resume or job-description content.
function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function fail(res, status, code, message) {
  return send(res, status, { error: { code, message } });
}

function parseBody(body) {
  if (body && typeof body === 'object') return body;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return null; }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST to analyze a resume.');
  }

  const apiKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim();
  if (!apiKey) return fail(res, 500, 'SERVER_CONFIG', 'The server is not configured yet. The site owner must set OPENROUTER_API_KEY.');

  const model = (process.env.OPENROUTER_MODEL && process.env.OPENROUTER_MODEL.trim()) || DEFAULT_MODEL;
  const body = parseBody(req.body);
  if (!body) return fail(res, 400, 'INVALID_REQUEST', 'The request could not be read. Refresh the page and try again.');

  const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
  const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';

  if (!resumeText) return fail(res, 400, 'MISSING_RESUME', 'Upload a PDF resume before analyzing.');
  if (!jobDescription) return fail(res, 400, 'MISSING_JOB_DESCRIPTION', 'Paste the job description before analyzing.');
  if (resumeText.length < LIMITS.resumeMinChars) {
    return fail(res, 400, 'RESUME_TOO_SHORT', 'The resume text is too short to analyze. Check that the PDF contains selectable text.');
  }
  if (resumeText.length > LIMITS.resumeMaxChars) {
    return fail(res, 413, 'RESUME_TOO_LONG', 'The resume text is too long. Shorten the resume and try again.');
  }
  if (jobDescription.length < LIMITS.jdMinChars) {
    return fail(res, 400, 'JOB_DESCRIPTION_TOO_SHORT', 'The job description needs at least ' + LIMITS.jdMinChars + ' characters.');
  }
  if (jobDescription.length > LIMITS.jdMaxChars) {
    return fail(res, 413, 'JOB_DESCRIPTION_TOO_LONG', 'The job description is longer than ' + LIMITS.jdMaxChars.toLocaleString() + ' characters. Remove extra text and try again.');
  }

  const startedAt = Date.now();
  try {
    const result = await runAnalysis({ apiKey, model, resumeText, jobDescription });
    console.info('analyze completed: duration_ms=' + (Date.now() - startedAt) + ' model=' + model);
    return send(res, 200, result);
  } catch (err) {
    const aiError = toAiError(err);
    console.error(
      'analyze failed: code=' + aiError.code +
      ' status=' + aiError.status +
      (aiError.upstreamStatus ? ' upstream=' + aiError.upstreamStatus : '') +
      ' duration_ms=' + (Date.now() - startedAt) +
      ' model=' + model
    );
    return fail(res, aiError.status, aiError.code, aiError.message);
  }
}
