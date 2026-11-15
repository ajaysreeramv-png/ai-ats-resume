// The scoring rubric the AI must follow. Points always total 100.
export const RUBRIC = [
  {
    category: 'Skills',
    maxPoints: 35,
    criteria: 'Share of required and preferred skills from the job description that the resume clearly shows. Implied or partial matches earn partial credit.',
  },
  {
    category: 'Experience',
    maxPoints: 25,
    criteria: 'Relevance, seniority, and recency of work experience to this role, plus evidence of measurable results.',
  },
  {
    category: 'Keywords',
    maxPoints: 15,
    criteria: 'Important job description terms used in natural context. Repetition without context earns no extra credit.',
  },
  {
    category: 'Education',
    maxPoints: 10,
    criteria: 'Degrees, certifications, or training that match the stated requirements.',
  },
  {
    category: 'Projects',
    maxPoints: 10,
    criteria: 'Relevant projects or initiatives that demonstrate the abilities the job requires.',
  },
  {
    category: 'Clarity and formatting',
    maxPoints: 5,
    criteria: 'Clear section headings, consistent dates, readable layout, and plain text that ATS software can parse.',
  },
];
