// Tests the real api/analyze.js handler with a mocked global fetch (OpenRouter).
// Run with: npm test   (no network or API key needed)
import assert from 'node:assert/strict';
import { RUBRIC } from '../lib/rubric.js';

process.env.OPENROUTER_API_KEY = 'test-key-123';
const { default: handler } = await import('../api/analyze.js');

const resumeText = 'Jane Doe. Frontend developer with 4 years of React and JavaScript experience. Built REST API integrations. B.Sc. Computer Science. Projects: portfolio site. '.repeat(3);
const jobDescription = 'We are hiring a Frontend Developer with 3+ years of React experience. Required: JavaScript, React, Tailwind CSS, Git. Preferred: Jest or Vitest testing and REST APIs.';

function goodModelJson(overrides = {}) {
  const breakdown = RUBRIC.map((r) => ({ category: r.category, maxPoints: r.maxPoints, awardedPoints: Math.floor(r.maxPoints * 0.7), reason: 'Evidence in resume.' }));
  const q = (rating) => ({ rating, assessment: 'Solid.' });
  return {
    atsScore: 999, // deliberately wrong: server must recompute from breakdown
    scoreExplanation: 'Good match.',
    scoreBreakdown: breakdown,
    skillsMatch: { matchPercentage: 70, matching: ['React'], partial: [{ skill: 'REST', note: 'Built REST API integrations.' }], missing: ['Tailwind CSS'] },
    keywords: { important: ['React', 'Git'], found: ['React'], missing: ['Git'] },
    resumeQuality: { summary: q(6), experience: q(7), education: q(8), technicalSkills: q(7), projects: q(5) },
    suggestions: { improvements: ['Name the React version used.'], missingInformation: [], formatting: ['Use standard headings.'] },
    jobMatch: { strengths: ['React experience'], gaps: ['Tailwind CSS'], overallExplanation: 'Strong React fit.' },
    recommendedActions: [{ priority: 'High', action: 'Add Git to skills if used.' }, { priority: 'Bogus', action: 'Low thing' }],
    ...overrides,
  };
}

function mockReq(body, method = 'POST') {
  return { method, body };
}
function mockRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.status = (c) => { res.statusCode = c; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; return res; };
  res.end = (b) => { res.body = b; };
  return res;
}
const validBody = { resumeText, jobDescription };

let calls = [];
function mockFetch(responder) {
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return responder(calls.length);
  };
}
const jsonResp = (status, obj) => ({ ok: status >= 200 && status < 300, status, json: async () => obj });
const contentResp = (content) => jsonResp(200, { choices: [{ message: { content } }] });

async function run(body, method) {
  const res = mockRes();
  await handler(mockReq(body, method), res);
  return { status: res.statusCode, data: JSON.parse(res.body), headers: res.headers };
}

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(`PASS  ${name}`); }
  catch (e) { results.push(`FAIL  ${name}: ${e.message}`); }
};

await check('405 for GET', async () => {
  const r = await run(validBody, 'GET');
  assert.equal(r.status, 405);
  assert.equal(r.data.error.code, 'METHOD_NOT_ALLOWED');
});

await check('500 SERVER_CONFIG when key missing', async () => {
  const saved = process.env.OPENROUTER_API_KEY; delete process.env.OPENROUTER_API_KEY;
  const r = await run(validBody);
  process.env.OPENROUTER_API_KEY = saved;
  assert.equal(r.status, 500); assert.equal(r.data.error.code, 'SERVER_CONFIG');
  assert.ok(r.data.error.message.includes('OPENROUTER_API_KEY'));
});

await check('400 for missing resume and short JD', async () => {
  let r = await run({ resumeText: '', jobDescription });
  assert.equal(r.data.error.code, 'MISSING_RESUME');
  r = await run({ resumeText, jobDescription: 'too short' });
  assert.equal(r.data.error.code, 'JOB_DESCRIPTION_TOO_SHORT');
  r = await run({ resumeText: 'x'.repeat(40000), jobDescription });
  assert.equal(r.status, 413); assert.equal(r.data.error.code, 'RESUME_TOO_LONG');
});

await check('200 success: valid JSON, score recomputed, priorities normalized', async () => {
  calls = []; mockFetch(() => contentResp(JSON.stringify(goodModelJson())));
  const r = await run(validBody);
  assert.equal(r.status, 200);
  assert.equal(r.data.model, 'openrouter/free');
  const expected = RUBRIC.reduce((s, r2) => s + Math.floor(r2.maxPoints * 0.7), 0);
  assert.equal(r.data.analysis.atsScore, expected);
  assert.equal(r.data.analysis.recommendedActions[1].priority, 'Medium');
  assert.equal(r.data.analysis.scoreBreakdown.length, RUBRIC.length);
  assert.equal(r.headers['Cache-Control'], 'no-store');
  // Request went to OpenRouter with bearer auth and JSON mode
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer test-key-123');
  const sent = JSON.parse(calls[0].opts.body);
  assert.deepEqual(sent.response_format, { type: 'json_object' });
  assert.equal(sent.messages[0].role, 'system');
});

await check('code-fenced JSON with prose is accepted', async () => {
  mockFetch(() => contentResp('Here you go:\n```json\n' + JSON.stringify(goodModelJson()) + '\n```\nThanks'));
  const r = await run(validBody);
  assert.equal(r.status, 200);
});

await check('invalid JSON twice -> 502 INVALID_AI_JSON after one retry', async () => {
  calls = []; mockFetch(() => contentResp('not json at all'));
  const r = await run(validBody);
  assert.equal(r.status, 502); assert.equal(r.data.error.code, 'INVALID_AI_JSON');
  assert.equal(calls.length, 2);
});

await check('incomplete structure -> INVALID_AI_RESPONSE (no secret or content leaked)', async () => {
  mockFetch(() => contentResp(JSON.stringify({ atsScore: 50 })));
  const r = await run(validBody);
  assert.equal(r.status, 502); assert.equal(r.data.error.code, 'INVALID_AI_RESPONSE');
  assert.ok(!JSON.stringify(r.data).includes('test-key'));
});

await check('401 -> AI_AUTH 502, no retry', async () => {
  calls = []; mockFetch(() => jsonResp(401, { error: { message: 'No auth credentials' } }));
  const r = await run(validBody);
  assert.equal(r.status, 502); assert.equal(r.data.error.code, 'AI_AUTH');
  assert.equal(calls.length, 1);
  assert.ok(r.data.error.message.includes('OPENROUTER_API_KEY'));
});

await check('429 -> RATE_LIMITED 429', async () => {
  mockFetch(() => jsonResp(429, { error: { message: 'rate limited' } }));
  const r = await run(validBody);
  assert.equal(r.status, 429); assert.equal(r.data.error.code, 'RATE_LIMITED');
});

await check('404 -> AI_MODEL mentions OPENROUTER_MODEL', async () => {
  mockFetch(() => jsonResp(404, { error: { message: 'model not found' } }));
  const r = await run(validBody);
  assert.equal(r.status, 502); assert.equal(r.data.error.code, 'AI_MODEL');
  assert.ok(r.data.error.message.includes('OPENROUTER_MODEL'));
});

await check('402 -> AI_CREDITS', async () => {
  mockFetch(() => jsonResp(402, { error: { message: 'insufficient credits' } }));
  const r = await run(validBody);
  assert.equal(r.data.error.code, 'AI_CREDITS');
});

await check('503 twice then success -> retry recovers', async () => {
  calls = []; mockFetch((n) => (n === 1 ? jsonResp(503, { error: { message: 'down' } }) : contentResp(JSON.stringify(goodModelJson()))));
  const r = await run(validBody);
  assert.equal(r.status, 200); assert.equal(calls.length, 2);
});

await check('200 body containing provider error is mapped', async () => {
  mockFetch(() => jsonResp(200, { error: { code: 429, message: 'upstream rate limit' } }));
  const r = await run(validBody);
  assert.equal(r.data.error.code, 'RATE_LIMITED');
});

await check('network failure -> AI_UNAVAILABLE 503', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  const r = await run(validBody);
  assert.equal(r.status, 503); assert.equal(r.data.error.code, 'AI_UNAVAILABLE');
});

await check('timeout (AbortError) -> AI_TIMEOUT 504', async () => {
  globalThis.fetch = async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; };
  const r = await run(validBody);
  assert.equal(r.status, 504); assert.equal(r.data.error.code, 'AI_TIMEOUT');
});

await check('400 mentioning response_format retries without JSON mode', async () => {
  calls = []; mockFetch((n) => (n === 1 ? jsonResp(400, { error: { message: 'response_format not supported' } }) : contentResp(JSON.stringify(goodModelJson()))));
  const r = await run(validBody);
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(calls[1].opts.body).response_format, undefined);
});

await check('404 that rejects JSON mode retries without it', async () => {
  calls = []; mockFetch((n) => (n === 1 ? jsonResp(404, { error: { message: 'No endpoints found that support the requested parameter response_format' } }) : contentResp(JSON.stringify(goodModelJson()))));
  const r = await run(validBody);
  assert.equal(r.status, 200); assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].opts.body).response_format, undefined);
});

await check('404 for an unknown model still maps to AI_MODEL (no retry)', async () => {
  calls = []; mockFetch(() => jsonResp(404, { error: { message: 'Model not found' } }));
  const r = await run(validBody);
  assert.equal(r.data.error.code, 'AI_MODEL'); assert.equal(calls.length, 1);
});

await check('custom OPENROUTER_MODEL is used', async () => {
  process.env.OPENROUTER_MODEL = 'qwen/qwen3-next-80b-a3b-instruct:free';
  calls = []; mockFetch(() => contentResp(JSON.stringify(goodModelJson())));
  const r = await run(validBody);
  delete process.env.OPENROUTER_MODEL;
  assert.equal(r.data.model, 'qwen/qwen3-next-80b-a3b-instruct:free');
  assert.equal(JSON.parse(calls[0].opts.body).model, 'qwen/qwen3-next-80b-a3b-instruct:free');
});

console.log(results.join('\n'));
const failed = results.filter((l) => l.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
