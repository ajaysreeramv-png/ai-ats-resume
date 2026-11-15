// Contract test: every analysis field that ResultsDashboard.jsx reads must exist in
// validateAnalysis() output, and the top-level keys must match the prompt's JSON shape.
// Run with: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RUBRIC } from '../lib/rubric.js';
import { validateAnalysis } from '../lib/validateAnalysis.js';

const EXPECTED_TOP_LEVEL = [
  'atsScore', 'scoreExplanation', 'scoreBreakdown', 'skillsMatch', 'keywords',
  'resumeQuality', 'suggestions', 'jobMatch', 'recommendedActions',
];

const sample = {
  atsScore: 0,
  scoreExplanation: 'Good match.',
  scoreBreakdown: RUBRIC.map((r) => ({ category: r.category, maxPoints: r.maxPoints, awardedPoints: 1, reason: 'Why.' })),
  skillsMatch: { matchPercentage: 50, matching: ['React'], partial: [{ skill: 'REST', note: 'Implied.' }], missing: ['Git'] },
  keywords: { important: ['React'], found: ['React'], missing: ['Git'] },
  resumeQuality: Object.fromEntries(['summary', 'experience', 'education', 'technicalSkills', 'projects'].map((k) => [k, { rating: 5, assessment: 'Ok.' }])),
  suggestions: { improvements: ['x'], missingInformation: [], formatting: ['y'] },
  jobMatch: { strengths: ['a'], gaps: ['b'], overallExplanation: 'Fit.' },
  recommendedActions: [{ priority: 'High', action: 'Do it.' }],
};
const a = validateAnalysis(sample);

// 1. Top-level shape matches the prompt contract exactly.
assert.deepEqual(Object.keys(a).sort(), [...EXPECTED_TOP_LEVEL].sort());

// 2. Every `a.<path>` the dashboard reads resolves to a defined value.
const dashboardSource = readFileSync(new URL('../src/components/ResultsDashboard.jsx', import.meta.url), 'utf8');
const paths = new Set([...dashboardSource.matchAll(/\ba\.([A-Za-z]+(?:\.[A-Za-z]+)*)/g)].map((m) => m[1]));
assert.ok(paths.size >= 8, `expected several dashboard paths, found ${paths.size}`);
for (const path of paths) {
  const value = path.split('.').reduce((obj, key) => obj?.[key], a);
  assert.notEqual(value, undefined, `ResultsDashboard reads a.${path} but validator output lacks it`);
}

// 3. Per-item fields the dashboard reads.
assert.equal(typeof a.scoreBreakdown[0].awardedPoints, 'number');
assert.equal(typeof a.scoreBreakdown[0].maxPoints, 'number');
assert.equal(typeof a.skillsMatch.partial[0].skill, 'string');
assert.equal(typeof a.skillsMatch.partial[0].note, 'string');
assert.equal(typeof a.resumeQuality.summary.rating, 'number');
assert.equal(typeof a.resumeQuality.summary.assessment, 'string');
assert.ok(['High', 'Medium', 'Low'].includes(a.recommendedActions[0].priority));

// 4. Score always equals the sum of the rubric breakdown.
assert.equal(a.atsScore, a.scoreBreakdown.reduce((s, b) => s + b.awardedPoints, 0));

console.log(`PASS  contract: ${paths.size} dashboard paths and top-level shape match the validator`);
