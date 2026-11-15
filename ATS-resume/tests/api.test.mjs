// Tests the Gemini-backed API handler with a mocked Google Gemini response.
import assert from 'node:assert/strict';
import { RUBRIC } from '../lib/rubric.js';

process.env.GEMINI_API_KEY = 'test-key-123';
const { default: handler } = await import('../api/analyze.js');

const resumeText = 'Jane Doe. Frontend developer with 4 years of React and JavaScript experience. Built REST API integrations. B.Sc. Computer Science. Projects: portfolio site. '.repeat(3);
const jobDescription = 'We are hiring a Frontend Developer with 3+ years of React experience. Required: JavaScript, React, Tailwind CSS, Git. Preferred: Jest or Vitest testing and REST APIs.';

function goodModelJson() {
  const breakdown = RUBRIC.map((r) => ({ category: r.category, maxPoints: r.maxPoints, awardedPoints: Math.floor(r.maxPoints * 0.7), reason: 'Evidence in resume.' }));
  const q = (rating) => ({ rating, assessment: 'Solid.' });
  return {
    atsScore: 999,
    scoreExplanation: 'Good match.',
    scoreBreakdown: breakdown,
    skillsMatch: { matchPercentage: 70, matching: ['React'], partial: [{ skill: 'REST', note: 'Built REST API integrations.' }], missing: ['Tailwind CSS'] },
    keywords: { important: ['React', 'Git'], found: ['React'], missing: ['Git'] },
    resumeQuality: { summary: q(6), experience: q(7), education: q(8), technicalSkills: q(7), projects: q(5) },
    suggestions: { improvements: ['Name the React version used.'], missingInformation: [], formatting: ['Use standard headings.'] },
    jobMatch: { strengths: ['React experience'], gaps: ['Tailwind CSS'], overallExplanation: 'Strong React fit.' },
    recommendedActions: [{ priority: 'High', action: 'Add Git to skills if used.' }],
  };
}

function mockRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.status = (c) => { res.statusCode = c; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; return res; };
  res.end = (b) => { res.body = b; };
  return res;
}
const validBody = { resumeText, jobDescription };
const geminiResponse = (text) => ({
  candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }],
  modelVersion: 'gemini-2.5-flash',
  usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200 },
});
async function run(body = validBody, method = 'POST') {
  const res = mockRes();
  await handler({ method, body }, res);
  return { status: res.statusCode, data: JSON.parse(res.body), headers: res.headers };
}

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push('PASS  ' + name); }
  catch (e) { results.push('FAIL  ' + name + ': ' + e.message); }
};

await check('405 for GET', async () => {
  const r = await run(validBody, 'GET');
  assert.equal(r.status, 405);
});
await check('missing Gemini key returns SERVER_CONFIG', async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const r = await run();
  process.env.GEMINI_API_KEY = saved;
  assert.equal(r.status, 500);
  assert.equal(r.data.error.code, 'SERVER_CONFIG');
});
await check('successful Gemini response returns validated analysis', async () => {
  let captured;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return { ok: true, status: 200, json: async () => geminiResponse(JSON.stringify(goodModelJson())) };
  };
  const r = await run();
  assert.equal(r.status, 200);
  assert.equal(r.data.model, 'gemini-2.5-flash');
  assert.equal(r.data.analysis.scoreBreakdown.length, RUBRIC.length);
  assert.equal(captured.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(captured.opts.headers['x-goog-api-key'], 'test-key-123');
  const sent = JSON.parse(captured.opts.body);
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.equal(sent.generationConfig.maxOutputTokens, 4096);
  assert.ok(sent.systemInstruction.parts[0].text.includes('ATS analyst'));
});
await check('invalid JSON returns INVALID_AI_JSON', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => geminiResponse('not json') });
  const r = await run();
  assert.equal(r.status, 502);
  assert.equal(r.data.error.code, 'INVALID_AI_JSON');
});
await check('Gemini 401/403 maps to AI_AUTH', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'API key invalid' } }) });
  const r = await run();
  assert.equal(r.status, 502);
  assert.equal(r.data.error.code, 'AI_AUTH');
});
await check('Gemini 429 maps to RATE_LIMITED', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'quota exceeded' } }) });
  const r = await run();
  assert.equal(r.status, 429);
  assert.equal(r.data.error.code, 'RATE_LIMITED');
});

console.log(results.join('\n'));
const failed = results.filter((line) => line.startsWith('FAIL')).length;
console.log('\n' + (results.length - failed) + '/' + results.length + ' passed');
process.exit(failed ? 1 : 0);
