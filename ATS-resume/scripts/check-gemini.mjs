// Live check: calls Google Gemini with a sample resume and validates the reply.
// Usage: GEMINI_API_KEY=... npm run check:gemini
// Optional: GEMINI_MODEL=... (defaults to gemini-3.5-flash-lite). Prints no resume content and no key.
import { runAnalysis } from '../lib/runAnalysis.js';
import { DEFAULT_MODEL } from '../lib/gemini.js';

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error('Set GEMINI_API_KEY first.');
  process.exit(1);
}
const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

const resumeText = `Alex Morgan
Frontend Developer
Experience
Frontend Developer, Brightline Labs (2021 to 2024). Built React and TypeScript dashboards used by 40 internal teams. Wrote unit tests with Jest. Integrated REST APIs and improved page load time by 30 percent.
Education
B.Sc. Computer Science, State University (2020).
Skills
JavaScript, React, TypeScript, HTML, CSS, Git, REST APIs.
Projects
Personal portfolio built with Vite and React.`;

const jobDescription = `We are hiring a Frontend Developer with 3+ years of React experience. You will build accessible interfaces and work with REST APIs. Required: JavaScript, React, Tailwind CSS, Git. Preferred: testing with Jest or Vitest and performance optimization.`;

try {
  const started = Date.now();
  const { analysis, model: used } = await runAnalysis({ apiKey, model, resumeText, jobDescription });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`PASS  Gemini returned valid analysis from model "${used}" in ${seconds}s`);
  console.log(`      ATS score: ${analysis.atsScore}/100, skills match: ${analysis.skillsMatch.matchPercentage}%`);
} catch (err) {
  console.error(`FAIL  ${err.code ?? 'ERROR'}: ${err.message}`);
  process.exit(1);
}
