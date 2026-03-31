function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2);
}

function hasKeywordMatch(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function deriveGuidanceKeywords(caseDoc) {
  const baseTokens = tokenize([
    caseDoc.caseType,
    caseDoc.title,
    caseDoc.aiCaseSummary,
    caseDoc.aiLawyerTypeNeeded,
    caseDoc.aiLawyerFitRationale,
    caseDoc.aiRelevantLaws,
  ].join(' '));

  return Array.from(new Set(baseTokens)).slice(0, 24);
}

function buildLocationReason(caseDoc, lawyer) {
  const caseLocation = normalizeText(caseDoc.location);
  const lawyerLocation = normalizeText(lawyer.location);

  if (!caseLocation || !lawyerLocation) {
    return null;
  }

  if (lawyerLocation === caseLocation) {
    return 'Located in the same city or area as the case.';
  }

  if (lawyerLocation.includes(caseLocation) || caseLocation.includes(lawyerLocation)) {
    return 'Practices in or near the case location.';
  }

  return null;
}

function buildCapacityReason(lawyer) {
  const activeCases = Array.isArray(lawyer.activeCases) ? lawyer.activeCases.length : 0;

  if (activeCases <= 3) {
    return 'Currently has lighter active load, which can help with responsiveness.';
  }

  if (activeCases <= 8) {
    return 'Active caseload still looks manageable for timely attention.';
  }

  return null;
}

function scoreLawyerForCase(caseDoc, lawyer) {
  const keywords = deriveGuidanceKeywords(caseDoc);
  const lawyerText = [
    lawyer.bio,
    lawyer.location,
    ...(lawyer.specializations || []),
  ].join(' ');

  let score = 0;
  const reasons = [];
  const breakdown = {};

  if ((lawyer.specializations || []).includes(caseDoc.caseType)) {
    score += 32;
    breakdown.specialization = 32;
    reasons.push(`Handles ${caseDoc.caseType} matters matching this case type.`);
  } else {
    breakdown.specialization = 0;
  }

  const keywordMatches = keywords.filter((keyword) => hasKeywordMatch(lawyerText, [keyword]));
  const guidanceScore = Math.min(keywordMatches.length * 4, 20);
  score += guidanceScore;
  breakdown.guidanceFit = guidanceScore;
  if (guidanceScore > 0) {
    reasons.push('Profile aligns with the AI-identified lawyer type and case context.');
  }

  const locationReason = buildLocationReason(caseDoc, lawyer);
  const locationScore = locationReason ? 12 : 0;
  score += locationScore;
  breakdown.location = locationScore;
  if (locationReason) {
    reasons.push(locationReason);
  }

  const ratingScore = Math.min((safeNumber(lawyer.rating) / 5) * 12, 12);
  score += ratingScore;
  breakdown.rating = Math.round(ratingScore);
  if (safeNumber(lawyer.rating) >= 4) {
    reasons.push(`Strong client rating at ${safeNumber(lawyer.rating).toFixed(1)} / 5.`);
  }

  const experienceScore = Math.min((safeNumber(lawyer.experience) / 12) * 10, 10);
  score += experienceScore;
  breakdown.experience = Math.round(experienceScore);
  if (safeNumber(lawyer.experience) >= 5) {
    reasons.push(`${safeNumber(lawyer.experience)} years of experience in practice.`);
  }

  const winRateScore = Math.min((safeNumber(lawyer.winRate) / 100) * 8, 8);
  score += winRateScore;
  breakdown.winRate = Math.round(winRateScore);
  if (safeNumber(lawyer.winRate) >= 60) {
    reasons.push(`Strong historical case record with ${safeNumber(lawyer.winRate).toFixed(1)}% win rate.`);
  }

  const capacityReason = buildCapacityReason(lawyer);
  const capacityScore = capacityReason ? 6 : 0;
  score += capacityScore;
  breakdown.capacity = capacityScore;
  if (capacityReason) {
    reasons.push(capacityReason);
  }

  if (caseDoc.budget && (lawyer.averageFixedFee || lawyer.hourlyRate)) {
    const indicativeFee = safeNumber(lawyer.averageFixedFee) || safeNumber(lawyer.hourlyRate) * 100;

    if (indicativeFee && indicativeFee <= caseDoc.budget) {
      score += 6;
      breakdown.budget = 6;
      reasons.push('Indicative pricing appears compatible with the case budget.');
    } else if (indicativeFee && indicativeFee <= caseDoc.budget * 1.4) {
      score += 3;
      breakdown.budget = 3;
      reasons.push('Indicative pricing is near the current case budget.');
    } else {
      breakdown.budget = 0;
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    recommendationScore: finalScore,
    recommendationReasons: Array.from(new Set(reasons)).slice(0, 4),
    recommendationSummary: `Recommended because this lawyer fits the AI-identified ${caseDoc.caseType || 'legal'} matter, procedural needs, and practical selection signals.`,
    recommendationBreakdown: breakdown,
  };
}

function rankLawyersForCase(caseDoc, lawyers) {
  return lawyers
    .map((lawyer) => ({
      ...lawyer.toObject(),
      ...scoreLawyerForCase(caseDoc, lawyer),
    }))
    .sort((a, b) => (
      b.recommendationScore - a.recommendationScore
      || safeNumber(b.winRate) - safeNumber(a.winRate)
      || safeNumber(b.rating) - safeNumber(a.rating)
    ));
}

module.exports = {
  deriveGuidanceKeywords,
  rankLawyersForCase,
  scoreLawyerForCase,
};
