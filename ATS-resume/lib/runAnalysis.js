import { AiError, DEFAULT_MODEL, callOpenRouter } from './openrouter.js';
import { buildMessages } from './prompt.js';
import { validateAnalysis, AnalysisValidationError } from './validateAnalysis.js';

// Vercel function limit is 60s (see vercel.json). Keep a safety margin.
const TOTAL_BUDGET_MS = 52_000;
const MAX_ATTEMPTS = 2;
const MIN_TIME_FOR_RETRY_MS = 20_000;

// Pulls a JSON object out of model text. Handles code fences and stray prose.
export function parseModelJson(content) {
  const invalid = () =>
    new AiError({ code: 'INVALID_AI_JSON', status: 502, retryable: true, message: 'The AI returned an unreadable response. Please try again.' });

  if (typeof content !== 'string') throw invalid();

  const text = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    // fall through to the object-slice fallback
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  throw invalid();
}

// Maps any thrown value to an AiError with a user-safe message.
export function toAiError(err) {
  if (err instanceof AiError) return err;
  if (err instanceof AnalysisValidationError) {
    return new AiError({ code: 'INVALID_AI_RESPONSE', status: 502, retryable: true, message: 'The AI response was incomplete. Please try again.' });
  }
  return new AiError({ code: 'SERVER_ERROR', status: 500, message: 'Something went wrong on the server. Please try again.' });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Calls the model, parses JSON, validates the structure, and retries once for
// transient failures or malformed output while time remains.
export async function runAnalysis({ apiKey, model = DEFAULT_MODEL, resumeText, jobDescription }) {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const messages = buildMessages(resumeText, jobDescription);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const content = await callOpenRouter({ apiKey, model, messages, deadline });
      const analysis = validateAnalysis(parseModelJson(content));
      return { analysis, model };
    } catch (err) {
      lastError = toAiError(err);
      const timeLeft = deadline - Date.now();
      // A hard timeout is not retried: another call to the same free router is
      // unlikely to finish inside the remaining Vercel execution window.
      if (lastError.code === 'AI_TIMEOUT' || !lastError.retryable || attempt === MAX_ATTEMPTS || timeLeft < MIN_TIME_FOR_RETRY_MS) break;
      await sleep(Math.min(1000, Math.max(0, timeLeft - MIN_TIME_FOR_RETRY_MS)));
    }
  }
  throw lastError;
}
