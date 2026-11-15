const cleanText = (value, max = 1200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const cleanList = (value, maxItems = 20, maxLength = 300) => Array.isArray(value)
  ? value.filter((item) => typeof item === 'string' && item.trim()).slice(0, maxItems).map((item) => cleanText(item, maxLength))
  : [];

export function validateSampleResume(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The AI returned an invalid resume.');
  const cleanObjects = (value, fields, maxItems = 8) => Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object').slice(0, maxItems).map((item) =>
        Object.fromEntries(fields.map(([key, max]) => [key, cleanText(item[key], max)]))
      )
    : [];

  return {
    fullName: cleanText(raw.fullName, 120),
    headline: cleanText(raw.headline, 160),
    contact: {
      email: cleanText(raw.contact?.email, 160),
      phone: cleanText(raw.contact?.phone, 80),
      location: cleanText(raw.contact?.location, 120),
      links: cleanList(raw.contact?.links, 5, 200),
    },
    summary: cleanText(raw.summary, 1200),
    skills: cleanList(raw.skills, 30, 100),
    experience: Array.isArray(raw.experience)
      ? raw.experience.filter((item) => item && typeof item === 'object').slice(0, 8).map((item) => ({
          role: cleanText(item.role, 160),
          company: cleanText(item.company, 160),
          dates: cleanText(item.dates, 100),
          bullets: cleanList(item.bullets, 6, 300),
        }))
      : [],
    education: cleanObjects(raw.education, [['degree', 160], ['institution', 180], ['dates', 100], ['details', 400]], 6),
    projects: cleanObjects(raw.projects, [['name', 160], ['description', 600], ['technologies', 240]], 8),
    certifications: cleanList(raw.certifications, 12, 180),
    additionalSections: cleanObjects(raw.additionalSections, [['title', 100], ['items', 700]], 5),
  };
}

export function buildSampleResumeMessages(resumeText, analysis) {
  const system = [
    'You are a professional resume writer. Create a clean, ATS-friendly sample resume using only verified facts from the supplied original resume and analysis report.',
    'The original resume is the source of truth. The analysis report may suggest improvements but must never be treated as evidence for new qualifications.',
    'Never invent or assume names, contact details, employers, job titles, dates, degrees, institutions, certifications, skills, project outcomes, numbers, or achievements.',
    'Rewrite existing content for clarity and professional impact without changing its meaning. Do not add metrics unless explicitly present in the original resume.',
    'Do not add missing job-description keywords as if the candidate has those skills. Missing skills may not be claimed.',
    'If a field is absent from the source, return an empty string or empty array. Keep unknown contact details blank.',
    'Use concise action-oriented bullet points, standard section names, and plain text. No tables, columns, icons, or graphics.',
    'Return only valid JSON with this exact structure:',
    JSON.stringify({
      fullName: 'Candidate full name or empty string',
      headline: 'Target role headline grounded in the source',
      contact: { email: '', phone: '', location: '', links: [] },
      summary: 'Professional summary',
      skills: ['Skills explicitly supported by source'],
      experience: [{ role: '', company: '', dates: '', bullets: [''] }],
      education: [{ degree: '', institution: '', dates: '', details: '' }],
      projects: [{ name: '', description: '', technologies: '' }],
      certifications: [''],
      additionalSections: [{ title: 'Section name', items: 'Text for section' }]
    }),
  ].join('\n');

  const user = [
    'ORIGINAL RESUME TEXT (source of truth):',
    '<original_resume>',
    resumeText.replace(/<\/?original_resume\s*>/gi, ''),
    '</original_resume>',
    '',
    'ATS ANALYSIS REPORT (use only to prioritize and improve wording, not to invent facts):',
    JSON.stringify(analysis),
    '',
    'Create the sample resume JSON now. Preserve factual accuracy and leave unavailable fields empty.'
  ].join('\n');

  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}
