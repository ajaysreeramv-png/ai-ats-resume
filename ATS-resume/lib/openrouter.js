// Server-side OpenRouter client. Runs only inside the Vercel function.
// The API key is passed in by the caller and is never returned to the browser.

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Used when OPENROUTER_MODEL is not set. "openrouter/free" is OpenRouter's router
// that picks from currently available free models. Set OPENROUTER_MODEL to pin a model.
export const DEFAULT_MODEL = 'openrouter/free';

export class AiError extends Error {
  // status: HTTP status returned to the browser. upstreamStatus: what OpenRouter said (logged only).
  constructor({ code, status, message, retryable = false, upstreamStatus = null }) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.upstreamStatus = upstreamStatus;
  }
}

function mapHttpError(upstreamStatus) {
  const base = { upstreamStatus };
  switch (upstreamStatus) {
    case 400:
      return new AiError({ ...base, code: 'AI_REQUEST', status: 502, message: 'The AI service could not process this request. Try a shorter resume or job description.' });
    case 401:
    case 403:
      return new AiError({ ...base, code: 'AI_AUTH', status: 502, message: 'The server could not authenticate with OpenRouter. The site owner should check OPENROUTER_API_KEY.' });
    case 402:
      return new AiError({ ...base, code: 'AI_CREDITS', status: 502, message: 'The OpenRouter account has no credits left for this model. The site owner should add credits or set a different OPENROUTER_MODEL.' });
    case 404:
      return new AiError({ ...base, code: 'AI_MODEL', status: 502, message: 'The configured AI model is unavailable on OpenRouter. The site owner should check OPENROUTER_MODEL.' });
    case 408:
      return new AiError({ ...base, code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
    case 429:
      return new AiError({ ...base, code: 'RATE_LIMITED', status: 429, message: 'The AI service is busy or its usage limit was reached. Wait a minute, then try again.' });
    default:
      if (upstreamStatus >= 500) {
        return new AiError({ ...base, code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'The AI service is temporarily unavailable. Please try again in a moment.' });
      }
      return new AiError({ ...base, code: 'AI_ERROR', status: 502, message: 'The AI service could not complete the analysis. Please try again.' });
  }
}

// Sends one chat completion request. `deadline` is an epoch-ms cutoff so the whole
// request chain stays under the Vercel function limit.
export async function callOpenRouter({ apiKey, model, messages, deadline, jsonMode = true }) {
  const timeoutMs = deadline - Date.now();
  if (timeoutMs < 1000) {
    throw new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeoutError = () =>
    new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.', retryable: false });

  try {
    const body = { model, messages, temperature: 0.2, max_tokens: 3000 };
    if (jsonMode) body.response_format = { type: 'json_object' };

    let response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'ResumeIQ',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err?.name === 'AbortError') throw timeoutError();
      throw new AiError({ code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'Could not reach the AI service. Please try again in a moment.' });
    }

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      if (err?.name === 'AbortError') throw timeoutError();
      data = null;
    }

    if (!response.ok) {
      // Some free models reject JSON mode. Retry once without it; the response is still validated.
      // Some models (or routers) reject JSON mode with 400 or 404. Retry once without it.
      const providerMessage = String(data?.error?.message ?? '');
      if (
        (response.status === 400 || response.status === 404) &&
        jsonMode &&
        /response_format|json|parameter|support|endpoint/i.test(providerMessage)
      ) {
        return callOpenRouter({ apiKey, model, messages, deadline, jsonMode: false });
      }
      throw mapHttpError(response.status);
    }

    // OpenRouter can report provider failures inside a 200 response.
    if (data?.error) {
      const code = Number(data.error.code);
      throw mapHttpError(Number.isFinite(code) && code >= 400 ? code : 502);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new AiError({ code: 'INVALID_AI_JSON', status: 502, retryable: true, message: 'The AI returned an empty response. Please try again.' });
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}
