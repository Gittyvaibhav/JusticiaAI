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

PROCEDURAL CHECKLIST:
[List the likely process ahead in numbered order, such as complaint, notice, filing, mediation, hearing, evidence, or appeal. Keep it practical.]

DOCUMENTS AND EVIDENCE TO GATHER:
[List the most important documents, records, notices, IDs, contracts, screenshots, receipts, witness details, or evidence to prepare.]

LIKELY FORUM OR AUTHORITY:
[State the likely court, tribunal, police authority, department, or forum that may handle the matter. Mention if it depends on facts or jurisdiction.]

EXPECTED TIMELINE:
[Give a practical estimate of what may happen in the next 48 hours, next 2-4 weeks, and longer term.]

KEY RISKS OR WEAKNESSES:
[List the main legal or practical risks, missing facts, evidence gaps, delay risks, or defense points that could weaken the case.]

CASE STRENGTH:
[State: Weak / Moderate / Strong - then explain why in 1-2 sentences]

LAWYER TYPE NEEDED:
[Describe exactly what kind of lawyer they need and why]

WHY THESE LAWYERS SHOULD FIT:
[Explain in 2-4 bullet points what qualities, experience, location, communication style, or pricing signals should be used to choose the best lawyer for this case.]

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
    nextSteps: section('IMMEDIATE NEXT STEPS', 'PROCEDURAL CHECKLIST'),
    proceduralChecklist: section('PROCEDURAL CHECKLIST', 'DOCUMENTS AND EVIDENCE TO GATHER'),
    documentsNeeded: section('DOCUMENTS AND EVIDENCE TO GATHER', 'LIKELY FORUM OR AUTHORITY'),
    likelyForum: section('LIKELY FORUM OR AUTHORITY', 'EXPECTED TIMELINE'),
    expectedTimeline: section('EXPECTED TIMELINE', 'KEY RISKS OR WEAKNESSES'),
    keyRisks: section('KEY RISKS OR WEAKNESSES', 'CASE STRENGTH'),
    caseStrength,
    caseStrengthExplanation: caseStrengthBlock,
    lawyerTypeNeeded: section('LAWYER TYPE NEEDED', 'WHY THESE LAWYERS SHOULD FIT'),
    lawyerFitRationale: section('WHY THESE LAWYERS SHOULD FIT', 'IMPORTANT DISCLAIMER'),
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
