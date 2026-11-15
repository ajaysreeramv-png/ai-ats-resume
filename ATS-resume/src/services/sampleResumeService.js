const STATUS_MESSAGES = {
  400: 'The sample resume request was incomplete. Please analyze your resume again.',
  413: 'The resume is too large to generate a sample.',
  429: 'The AI service is busy. Wait a minute, then try again.',
  500: 'The sample resume service is not configured correctly. Try again later.',
  502: 'The AI service could not create the sample resume. Please try again.',
  503: 'The AI service is temporarily unavailable. Please try again.',
  504: 'Sample resume generation took too long. Please try again.',
};

export async function generateSampleResume({ resumeText, analysis }) {
  let response;
  try {
    response = await fetch('/api/sample-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, analysis }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  let data = null;
  try { data = await response.json(); } catch { data = null; }

  if (!response.ok) {
    throw new Error(data?.error?.message || STATUS_MESSAGES[response.status] || 'Could not generate the sample resume.');
  }
  if (!data?.sampleResume) throw new Error('The generated resume was incomplete. Please try again.');
  return data.sampleResume;
}
