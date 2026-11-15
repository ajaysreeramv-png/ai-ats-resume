import { RUBRIC } from './rubric.js';

export class AnalysisValidationError extends Error {}

const clampInt = (value, min, max) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) throw new AnalysisValidationError('Expected a number');
  return Math.min(max, Math.max(min, n));
};

const text = (value, max = 600) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const list = (value, max = 12) =>
  Array.isArray(value)
    ? value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim().slice(0, 300)).slice(0, max)
    : [];

const assessment = (value) => ({
  rating: clampInt(value?.rating, 1, 10),
  assessment: text(value?.assessment),
});

// Checks the model JSON and normalizes it. The overall score is recomputed from the
// rubric breakdown so the number always matches its explanation.
export function validateAnalysis(raw) {
  if (!raw || typeof raw !== 'object') throw new AnalysisValidationError('Response is not an object');

  const items = Array.isArray(raw.scoreBreakdown) ? raw.scoreBreakdown : [];
  const scoreBreakdown = RUBRIC.map((rule) => {
    const found = items.find(
      (b) => String(b?.category ?? '').trim().toLowerCase() === rule.category.toLowerCase()
    );
    if (!found) throw new AnalysisValidationError(`Missing score category: ${rule.category}`);
    return {
      category: rule.category,
      maxPoints: rule.maxPoints,
      awardedPoints: clampInt(found.awardedPoints, 0, rule.maxPoints),
      reason: text(found.reason, 400),
    };
  });

  const sm = raw.skillsMatch ?? {};
  const kw = raw.keywords ?? {};
  const rq = raw.resumeQuality ?? {};
  const sg = raw.suggestions ?? {};
  const jm = raw.jobMatch ?? {};

  return {
    atsScore: scoreBreakdown.reduce((sum, b) => sum + b.awardedPoints, 0),
    scoreExplanation: text(raw.scoreExplanation, 600),
    scoreBreakdown,
    skillsMatch: {
      matchPercentage: clampInt(sm.matchPercentage, 0, 100),
      matching: list(sm.matching),
      partial: (Array.isArray(sm.partial) ? sm.partial : [])
        .filter((p) => p?.skill)
        .slice(0, 12)
        .map((p) => ({ skill: text(p.skill, 120), note: text(p.note, 300) })),
      missing: list(sm.missing),
    },
    keywords: {
      important: list(kw.important, 25),
      found: list(kw.found, 25),
      missing: list(kw.missing, 25),
    },
    resumeQuality: {
      summary: assessment(rq.summary),
      experience: assessment(rq.experience),
      education: assessment(rq.education),
      technicalSkills: assessment(rq.technicalSkills),
      projects: assessment(rq.projects),
    },
    suggestions: {
      improvements: list(sg.improvements),
      missingInformation: list(sg.missingInformation),
      formatting: list(sg.formatting),
    },
    jobMatch: {
      strengths: list(jm.strengths),
      gaps: list(jm.gaps),
      overallExplanation: text(jm.overallExplanation, 800),
    },
    recommendedActions: (Array.isArray(raw.recommendedActions) ? raw.recommendedActions : [])
      .filter((a) => a?.action)
      .slice(0, 10)
      .map((a) => ({
        priority: ['High', 'Medium', 'Low'].includes(a.priority) ? a.priority : 'Medium',
        action: text(a.action, 300),
      })),
  };
}
