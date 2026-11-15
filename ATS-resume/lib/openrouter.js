// Server-side OpenRouter client. Runs only inside the Vercel function.
// Never return API keys, prompts, resume text, or raw provider responses to the browser.

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_MODEL = 'openrouter/free';

export class AiError extends Error {
  constructor({ code, status, message, retryable = false, upstreamStatus = null, diagnostics = null }) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.upstreamStatus = upstreamStatus;
    this.diagnostics = diagnostics;
  }
}

function mapHttpError(upstreamStatus) {
  const base = { upstreamStatus };
  switch (upstreamStatus) {
    case 400: return new AiError({ ...base, code: 'AI_REQUEST', status: 502, message: 'The AI service could not process this request. Try a shorter resume or job description.' });
    case 401:
    case 403: return new AiError({ ...base, code: 'AI_AUTH', status: 502, message: 'The server could not authenticate with OpenRouter. The site owner should check OPENROUTER_API_KEY.' });
    case 402: return new AiError({ ...base, code: 'AI_CREDITS', status: 502, message: 'The OpenRouter account has no credits left for this model. The site owner should add credits or set a different OPENROUTER_MODEL.' });
    case 404: return new AiError({ ...base, code: 'AI_MODEL', status: 502, message: 'The configured AI model is unavailable on OpenRouter. The site owner should check OPENROUTER_MODEL.' });
    case 408: return new AiError({ ...base, code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
    case 429: return new AiError({ ...base, code: 'RATE_LIMITED', status: 429, message: 'The AI service is busy or its usage limit was reached. Wait a minute, then try again.' });
    default:
      if (upstreamStatus >= 500) return new AiError({ ...base, code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'The AI service is temporarily unavailable. Please try again in a moment.' });
      return new AiError({ ...base, code: 'AI_ERROR', status: 502, message: 'The AI service could not complete the analysis. Please try again.' });
  }
}

function readTextContent(message) {
  const content = message && message.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part && (part.type === 'text' || typeof part.text === 'string'))
      .map((part) => typeof part.text === 'string' ? part.text : '')
      .join('\n')
      .trim();
  }
  return '';
}

export async function callOpenRouter({ apiKey, model, messages, deadline, jsonMode = true }) {
  const timeoutMs = deadline - Date.now();
  if (timeoutMs < 1000) {
    throw new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeoutError = () => new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.', retryable: false });

  try {
    const body = { model, messages, temperature: 0.1, max_tokens: 3000 };
    if (jsonMode) body.response_format = { type: 'json_object' };

    let response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'X-Title': 'ResumeIQ',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw timeoutError();
      throw new AiError({ code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'Could not reach the AI service. Please try again in a moment.' });
    }

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      if (err && err.name === 'AbortError') throw timeoutError();
      throw new AiError({
        code: 'AI_BAD_GATEWAY_RESPONSE',
        status: 502,
        retryable: true,
        upstreamStatus: response.status,
        message: 'The AI service returned an unreadable response. Please try again.',
        diagnostics: { responseStatus: response.status, responseJson: false },
      });
    }

    if (!response.ok) {
      const providerMessage = String(data && data.error && data.error.message || '');
      if ((response.status === 400 || response.status === 404) && jsonMode && /response_format|json|parameter|support|endpoint/i.test(providerMessage)) {
        return callOpenRouter({ apiKey, model, messages, deadline, jsonMode: false });
      }
      const mapped = mapHttpError(response.status);
      mapped.diagnostics = {
        responseStatus: response.status,
        returnedModel: typeof data?.model === 'string' ? data.model : null,
      };
      throw mapped;
    }

    if (data && data.error) {
      const code = Number(data.error.code);
      const mapped = mapHttpError(Number.isFinite(code) && code >= 400 ? code : 502);
      mapped.diagnostics = { responseStatus: response.status };
      throw mapped;
    }

    const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
    const message = choice?.message || null;
    const content = readTextContent(message);
    const diagnostics = {
      responseStatus: response.status,
      returnedModel: typeof data?.model === 'string' ? data.model : null,
      provider: typeof choice?.provider === 'string' ? choice.provider : null,
      finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
      contentType: Array.isArray(message?.content) ? 'array' : typeof message?.content,
      contentLength: content.length,
      hasReasoning: Boolean(message?.reasoning || message?.reasoning_content),
      hasToolCalls: Array.isArray(message?.tool_calls) && message.tool_calls.length > 0,
      completionTokens: Number.isFinite(data?.usage?.completion_tokens) ? data.usage.completion_tokens : null,
    };

    if (!content) {
      const truncated = diagnostics.finishReason === 'length';
      throw new AiError({
        code: truncated ? 'AI_OUTPUT_TRUNCATED' : 'AI_EMPTY_RESPONSE',
        status: 502,
        retryable: true,
        message: truncated
          ? 'The AI response was cut off. Try a shorter resume or job description.'
          : 'The AI model did not return analysis text. Please try again.',
        diagnostics,
      });
    }

    if (diagnostics.finishReason === 'length') {
      throw new AiError({
        code: 'AI_OUTPUT_TRUNCATED',
        status: 502,
        retryable: true,
        message: 'The AI response was cut off. Try a shorter resume or job description.',
        diagnostics,
      });
    }

    return { content, diagnostics };
  } finally {
    clearTimeout(timer);
  }
}
