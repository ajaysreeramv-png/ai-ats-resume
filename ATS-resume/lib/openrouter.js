// Server-side Google Gemini client. Runs only inside the Vercel function.
// Never return API keys, prompts, resume text, or raw provider responses to the browser.

export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
export const DEFAULT_MODEL = 'gemini-2.5-flash';

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

function mapHttpError(upstreamStatus, providerMessage = '') {
  const base = { upstreamStatus };
  switch (upstreamStatus) {
    case 400:
      return new AiError({ ...base, code: 'AI_REQUEST', status: 502, message: 'Gemini could not process this request. Try a shorter resume or job description.' });
    case 401:
    case 403:
      return new AiError({ ...base, code: 'AI_AUTH', status: 502, message: 'The server could not authenticate with Google Gemini. Check GEMINI_API_KEY in Vercel.' });
    case 404:
      return new AiError({ ...base, code: 'AI_MODEL', status: 502, message: 'The configured Gemini model is unavailable. Check GEMINI_MODEL in Vercel.' });
    case 408:
      return new AiError({ ...base, code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
    case 429:
      return new AiError({ ...base, code: 'RATE_LIMITED', status: 429, message: 'Gemini usage is temporarily limited. Wait a little and try again.' });
    default:
      if (upstreamStatus >= 500) return new AiError({ ...base, code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'Google Gemini is temporarily unavailable. Please try again.' });
      return new AiError({ ...base, code: 'AI_ERROR', status: 502, message: providerMessage || 'Gemini could not complete the analysis.' });
  }
}

export async function callGemini({ apiKey, model, messages, deadline }) {
  const timeoutMs = deadline - Date.now();
  if (timeoutMs < 1000) {
    throw new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeoutError = () => new AiError({ code: 'AI_TIMEOUT', status: 504, message: 'The analysis took too long. Try again in a moment.', retryable: false });

  try {
    const systemText = messages.find((m) => m.role === 'system')?.content || '';
    const userText = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n\n');
    const url = GEMINI_URL + '/' + encodeURIComponent(model) + ':generateContent';

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw timeoutError();
      throw new AiError({ code: 'AI_UNAVAILABLE', status: 503, retryable: true, message: 'Could not reach Google Gemini. Please try again.' });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new AiError({
        code: 'AI_BAD_GATEWAY_RESPONSE',
        status: 502,
        retryable: true,
        upstreamStatus: response.status,
        message: 'Gemini returned an unreadable response. Please try again.',
        diagnostics: { responseStatus: response.status, responseJson: false },
      });
    }

    if (!response.ok) {
      const providerMessage = String(data?.error?.message || '');
      const mapped = mapHttpError(response.status, providerMessage);
      mapped.diagnostics = {
        responseStatus: response.status,
        providerCode: data?.error?.status || null,
      };
      throw mapped;
    }

    const candidate = data?.candidates?.[0];
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const content = parts.map((part) => typeof part?.text === 'string' ? part.text : '').join('\n').trim();
    const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : null;
    const diagnostics = {
      responseStatus: response.status,
      returnedModel: typeof data?.modelVersion === 'string' ? data.modelVersion : model,
      finishReason,
      contentLength: content.length,
      promptTokens: Number.isFinite(data?.usageMetadata?.promptTokenCount) ? data.usageMetadata.promptTokenCount : null,
      outputTokens: Number.isFinite(data?.usageMetadata?.candidatesTokenCount) ? data.usageMetadata.candidatesTokenCount : null,
    };

    if (!content || finishReason === 'MAX_TOKENS') {
      throw new AiError({
        code: finishReason === 'MAX_TOKENS' ? 'AI_OUTPUT_TRUNCATED' : 'AI_EMPTY_RESPONSE',
        status: 502,
        retryable: finishReason !== 'MAX_TOKENS',
        message: finishReason === 'MAX_TOKENS'
          ? 'Gemini reached its response limit. Try a shorter resume or job description.'
          : 'Gemini did not return analysis text. Please try again.',
        diagnostics,
      });
    }

    if (finishReason && !['STOP', 'FINISH_REASON_UNSPECIFIED'].includes(finishReason)) {
      throw new AiError({
        code: 'AI_INCOMPLETE_RESPONSE',
        status: 502,
        retryable: false,
        message: 'Gemini could not finish the analysis. Please try again.',
        diagnostics,
      });
    }

    return { content, diagnostics };
  } finally {
    clearTimeout(timer);
  }
}
