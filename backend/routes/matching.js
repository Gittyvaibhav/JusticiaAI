const express = require('express');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');

const router = express.Router();

// Matching algorithm
function calculateMatchingScore(caseData, lawyer) {
  let score = 0;
  let maxScore = 0;

  // Specialization match (30 points)
  maxScore += 30;
  if (lawyer.specializations.includes(caseData.caseType)) {
    score += 30;
  }

  // Location match (20 points)
  maxScore += 20;
  if (lawyer.location && caseData.location) {
    const normalizedLawyerLoc = lawyer.location.toLowerCase();
    const normalizedCaseLoc = caseData.location.toLowerCase();
    if (normalizedLawyerLoc === normalizedCaseLoc || normalizedLawyerLoc.includes(normalizedCaseLoc)) {
      score += 20;
    }
  }

  // Rating (20 points)
  maxScore += 20;
  if (lawyer.rating) {
    score += (lawyer.rating / 5) * 20;
  }

  // Experience (15 points)
  maxScore += 15;
  if (lawyer.experience) {
    const yearsScore = Math.min((lawyer.experience / 10) * 15, 15);
    score += yearsScore;
  }

  // Budget compatibility (10 points)
  maxScore += 10;
  if (caseData.budget && (lawyer.averageFixedFee || lawyer.hourlyRate)) {
    const lawyerFee = lawyer.averageFixedFee || (lawyer.hourlyRate * 100); // Estimate
    if (lawyerFee <= caseData.budget) {
      score += 10;
    } else if (lawyerFee <= caseData.budget * 1.5) {
      score += 5;
    }
  }

  // Availability (5 points)
  maxScore += 5;
  if (lawyer.activeCases && lawyer.activeCases.length < 10) {
    score += 5;
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return Math.round(percentage);
}

// Get matching lawyers for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const lawyers = await Lawyer.find({
      specializations: caseData.caseType,
      verified: true,
    }).limit(20);

    const matchedLawyers = lawyers
      .map(lawyer => ({
        ...lawyer.toObject(),
        matchingScore: calculateMatchingScore(caseData, lawyer),
      }))
      .sort((a, b) => b.matchingScore - a.matchingScore);

    // Update case with matching scores
    await Case.findByIdAndUpdate(caseId, {
      matchingScore: matchedLawyers.length > 0 ? matchedLawyers[0].matchingScore : 0,
    });

    res.json(matchedLawyers);
  } catch (error) {
    console.error('Error getting matching lawyers:', error);
    res.status(500).json({ error: 'Error getting matching lawyers' });
  }
});

// Search lawyers with filters
router.get('/search', async (req, res) => {
  try {
    const {
      specialization,
      location,
      maxBudget,
      minRating,
      verified,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (specialization) {
      filter.specializations = specialization;
    }

    if (location) {
      const locationRegex = new RegExp(location, 'i');
      filter.location = locationRegex;
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (verified === 'true') {
      filter.verified = true;
    }

    let query = Lawyer.find(filter);

    // Handle budget filter (with hourly rate estimation)
    if (maxBudget) {
      const budgetNum = parseFloat(maxBudget);
      query = query.where('$or', [
        { averageFixedFee: { $lte: budgetNum } },
        { hourlyRate: { $lte: budgetNum / 100 } },
      ]);
    }

    const skip = (page - 1) * limit;
    const lawyers = await query
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await Lawyer.countDocuments(filter);

    res.json({
      lawyers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error searching lawyers:', error);
    res.status(500).json({ error: 'Error searching lawyers' });
  }
});

// Get lawyer recommendations for case type
router.get('/recommendations/:caseType', async (req, res) => {
  try {
    const { caseType } = req.params;

    const lawyers = await Lawyer.find({
      specializations: caseType,
      verified: true,
    })
      .sort({ rating: -1 })
      .limit(10)
      .select('-password');

    res.json(lawyers);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Error getting recommendations' });
  }
});

// Get top lawyers by location and specialization
router.get('/top-rated', async (req, res) => {
  try {
    const { location, specialization, limit = 10 } = req.query;

    const filter = {
      verified: true,
      rating: { $gt: 0 },
    };

    if (location) {
      const locationRegex = new RegExp(location, 'i');
      filter.location = locationRegex;
    }

    if (specialization) {
      filter.specializations = specialization;
    }

    const lawyers = await Lawyer.find(filter)
      .sort({ rating: -1 })
      .limit(parseInt(limit))
      .select('-password');

    res.json(lawyers);
  } catch (error) {
    console.error('Error getting top lawyers:', error);
    res.status(500).json({ error: 'Error getting top lawyers' });
  }
});

module.exports = router;
