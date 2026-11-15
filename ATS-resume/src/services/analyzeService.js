const STATUS_MESSAGES = {
  400: 'The request was incomplete. Check your resume and job description, then try again.',
  413: 'The resume or job description is too large. Shorten it and try again.',
  429: 'The AI service is busy. Wait a minute, then try again.',
  500: 'The analysis service is not configured correctly. Try again later.',
  502: 'The AI service could not complete the analysis. Please try again.',
  503: 'The AI service is temporarily unavailable. Please try again in a moment.',
  504: 'The analysis took too long. Try again in a moment.',
};

// Sends extracted text to the serverless API. Returns { analysis, model }.
export async function analyzeResume({ resumeText, jobDescription }) {
  let response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription }),
    });
  } catch {
    throw new Error('Network error. Check your internet connection and try again.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'The analysis service was not found. Make sure the project is deployed on Vercel with the api folder.'
      );
    }
    throw new Error(
      data?.error?.message || STATUS_MESSAGES[response.status] || 'Something went wrong while analyzing your resume. Please try again.'
    );
  }

  if (!data?.analysis) {
    throw new Error('The analysis response was incomplete. Please try again.');
  }

  return data;
}
