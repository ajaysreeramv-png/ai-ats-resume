import { LIMITS } from '../lib/limits.js';
import { DEFAULT_MODEL, callGemini } from '../lib/gemini.js';
import { parseModelJson, toAiError } from '../lib/runAnalysis.js';
import { validateAnalysis } from '../lib/validateAnalysis.js';
import { buildSampleResumeMessages, validateSampleResume } from '../lib/sampleResume.js';

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
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST to generate a sample resume.');
  }

  const apiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
  if (!apiKey) return fail(res, 500, 'SERVER_CONFIG', 'The server is not configured. The site owner must set GEMINI_API_KEY.');

  const model = (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || DEFAULT_MODEL;
  const body = parseBody(req.body);
  if (!body) return fail(res, 400, 'INVALID_REQUEST', 'The request could not be read. Please try again.');

  const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
  if (resumeText.length < LIMITS.resumeMinChars) {
    return fail(res, 400, 'RESUME_REQUIRED', 'Please upload your resume again before generating a sample.');
  }
  if (resumeText.length > LIMITS.resumeMaxChars) {
    return fail(res, 413, 'RESUME_TOO_LONG', 'The resume text is too long. Shorten it and try again.');
  }

  let analysis;
  try {
    analysis = validateAnalysis(body.analysis);
  } catch {
    return fail(res, 400, 'INVALID_REPORT', 'The analysis report is incomplete. Please analyze the resume again.');
  }

  const startedAt = Date.now();
  try {
    const result = await callGemini({
      apiKey,
      model,
      messages: buildSampleResumeMessages(resumeText, analysis),
      deadline: startedAt + 48_000,
    });
    const sampleResume = validateSampleResume(parseModelJson(result.content, result.diagnostics));
    if (!sampleResume.fullName && !sampleResume.summary && !sampleResume.skills.length &&
        !sampleResume.experience.length && !sampleResume.education.length && !sampleResume.projects.length) {
      return fail(res, 502, 'EMPTY_SAMPLE', 'The AI could not build a sample from this resume. Please try again.');
    }
    console.info('sample resume generated: duration_ms=' + (Date.now() - startedAt) + ' model=' + model);
    return send(res, 200, { sampleResume });
  } catch (err) {
    const aiError = toAiError(err);
    console.error(
      'sample resume failed: code=' + aiError.code +
      ' status=' + aiError.status +
      (aiError.upstreamStatus ? ' upstream=' + aiError.upstreamStatus : '') +
      ' duration_ms=' + (Date.now() - startedAt) +
      ' model=' + model
    );
    return fail(res, aiError.status, aiError.code, aiError.message);
  }
}
