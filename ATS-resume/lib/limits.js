// Shared by the browser and the serverless function. Change limits here only.
export const LIMITS = {
  maxPdfBytes: 5 * 1024 * 1024, // 5 MB
  maxPdfPages: 15,
  resumeMinChars: 100,
  resumeMaxChars: 30000,
  jdMinChars: 80,
  jdMaxChars: 8000,
};
