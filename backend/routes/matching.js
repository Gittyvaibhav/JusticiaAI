const express = require('express');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');
const { rankLawyersForCase, scoreLawyerForCase } = require('../utils/recommendationEngine');

const router = express.Router();

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

    const matchedLawyers = rankLawyersForCase(caseData, lawyers).map((lawyer) => ({
      ...lawyer,
      matchingScore: lawyer.recommendationScore,
    }));

    await Case.findByIdAndUpdate(caseId, {
      matchingScore: matchedLawyers.length > 0 ? matchedLawyers[0].matchingScore : 0,
    });

    res.json(matchedLawyers);
  } catch (error) {
    console.error('Error getting matching lawyers:', error);
    res.status(500).json({ error: 'Error getting matching lawyers' });
  }
});

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
      .limit(parseInt(limit, 10))
      .select('-password');

    const total = await Lawyer.countDocuments(filter);

    res.json({
      lawyers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error searching lawyers:', error);
    res.status(500).json({ error: 'Error searching lawyers' });
  }
});

router.get('/recommendations/:caseType', async (req, res) => {
  try {
    const { caseType } = req.params;

    const lawyers = await Lawyer.find({
      specializations: caseType,
      verified: true,
    })
      .limit(10)
      .select('-password');

    res.json(lawyers.map((lawyer) => ({
      ...lawyer.toObject(),
      ...scoreLawyerForCase({ caseType }, lawyer),
    })));
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Error getting recommendations' });
  }
});

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
      .limit(parseInt(limit, 10))
      .select('-password');

    res.json(lawyers);
  } catch (error) {
    console.error('Error getting top lawyers:', error);
    res.status(500).json({ error: 'Error getting top lawyers' });
  }
});

module.exports = router;
