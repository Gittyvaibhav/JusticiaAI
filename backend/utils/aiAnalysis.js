const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function buildLegalPrompt({ description, caseType, location, urgency }) {
  return `You are an expert legal advisor in India specializing in ${caseType} law.
A person from ${location} has described their legal problem:
'${description}'
Urgency level: ${urgency}

Provide a structured legal analysis in exactly this format:

CASE SUMMARY:
[Write 2-3 sentences summarizing the core legal issue]

RELEVANT LAWS AND SECTIONS:
[List the specific IPC sections, acts, or legal provisions that apply. Be specific.]

IMMEDIATE NEXT STEPS:
[List 4-5 clear, actionable steps the person should take right now, numbered]

CASE STRENGTH:
[State: Weak / Moderate / Strong - then explain why in 1-2 sentences]

LAWYER TYPE NEEDED:
[Describe exactly what kind of lawyer they need and why]

IMPORTANT DISCLAIMER:
This is AI-generated legal information for guidance only. Please consult a qualified lawyer before taking any legal action.`;
}

function parseGeminiResponse(text) {
  const normalizedText = text.replace(/\r/g, '');

  const section = (start, next) => {
    const regex = new RegExp(`${start}:\\s*([\\s\\S]*?)(?=${next ? `${next}:` : '$'})`, 'i');
    return normalizedText.match(regex)?.[1]?.trim() || '';
  };

  const caseStrengthBlock = section('CASE STRENGTH', 'LAWYER TYPE NEEDED');
  let caseStrength = 'Moderate';

  if (/strong/i.test(caseStrengthBlock)) {
    caseStrength = 'Strong';
  } else if (/weak/i.test(caseStrengthBlock)) {
    caseStrength = 'Weak';
  }

  return {
    fullResponse: normalizedText,
    caseSummary: section('CASE SUMMARY', 'RELEVANT LAWS AND SECTIONS'),
    relevantLaws: section('RELEVANT LAWS AND SECTIONS', 'IMMEDIATE NEXT STEPS'),
    nextSteps: section('IMMEDIATE NEXT STEPS', 'CASE STRENGTH'),
    caseStrength,
    caseStrengthExplanation: caseStrengthBlock,
    lawyerTypeNeeded: section('LAWYER TYPE NEEDED', 'IMPORTANT DISCLAIMER'),
    disclaimer: section('IMPORTANT DISCLAIMER'),
  };
}

async function analyzeCaseWithGemini(payload) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const prompt = buildLegalPrompt(payload);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return parseGeminiResponse(responseText);
}

module.exports = {
  analyzeCaseWithGemini,
  buildLegalPrompt,
  parseGeminiResponse,
};
