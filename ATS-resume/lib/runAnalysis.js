import { AiError, DEFAULT_MODEL, callOpenRouter } from './openrouter.js';
import { buildMessages } from './prompt.js';
import { validateAnalysis, AnalysisValidationError } from './validateAnalysis.js';

// Vercel function limit is 60s. Keep a safety margin for the response.
const TOTAL_BUDGET_MS = 52_000;
const MAX_ATTEMPTS = 2;
const MIN_TIME_FOR_RETRY_MS = 20_000;

export function parseModelJson(content, diagnostics = null) {
  const invalid = (reason) =>
    new AiError({
      code: 'INVALID_AI_JSON',
      status: 502,
      retryable: true,
      message: 'The AI returned a response that was not valid JSON. Please try again.',
      diagnostics: { ...diagnostics, parseResult: reason },
    });

  if (typeof content !== 'string' || !content.trim()) throw invalid('empty_content');

  const cleaned = content
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Some providers add a short preamble around the JSON object.
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw invalid('malformed_json_object');
    }
  }
  throw invalid('no_json_object_found');
}

export function toAiError(err) {
  if (err instanceof AiError) return err;
  if (err instanceof AnalysisValidationError) {
    return new AiError({
      code: 'INVALID_AI_RESPONSE',
      status: 502,
      retryable: true,
      message: 'The AI response was incomplete. Please try again.',
    });
  }
  return new AiError({ code: 'SERVER_ERROR', status: 500, message: 'Something went wrong on the server. Please try again.' });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAnalysis({ apiKey, model = DEFAULT_MODEL, resumeText, jobDescription }) {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const messages = buildMessages(resumeText, jobDescription);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await callOpenRouter({ apiKey, model, messages, deadline });
      const raw = parseModelJson(result.content, result.diagnostics);
      const analysis = validateAnalysis(raw);
      return { analysis, model: result.diagnostics?.returnedModel || model };
    } catch (err) {
      lastError = toAiError(err);
      const timeLeft = deadline - Date.now();
      if (
        lastError.code === 'AI_TIMEOUT' ||
        !lastError.retryable ||
        attempt === MAX_ATTEMPTS ||
        timeLeft < MIN_TIME_FOR_RETRY_MS
      ) break;

      // Retry once only when enough execution time remains.
      await sleep(Math.min(750, Math.max(0, timeLeft - MIN_TIME_FOR_RETRY_MS)));
    }
  }
  throw lastError;
}
