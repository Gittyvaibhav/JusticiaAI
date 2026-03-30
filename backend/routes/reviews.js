const express = require('express');
const Review = require('../models/Review');
const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Add review for lawyer
router.post('/add-review', authMiddleware, async (req, res) => {
  try {
    const { caseId, lawyerId, rating, title, comment, caseOutcome } = req.body;
    const clientId = req.user.id;

    // Validate inputs
    if (!caseId || !lawyerId || !rating || !title || !comment || !caseOutcome) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Create review
    const review = new Review({
      caseId,
      lawyerId,
      clientId,
      rating,
      title,
      comment,
      caseOutcome,
      verified: true,
    });

    await review.save();

    // Update lawyer's rating
    const allReviews = await Review.find({ lawyerId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const successCount = allReviews.filter(r => r.caseOutcome === 'won' || r.caseOutcome === 'settled').length;
    const successRate = (successCount / allReviews.length) * 100;

    await Lawyer.findByIdAndUpdate(
      lawyerId,
      {
        rating: parseFloat(avgRating.toFixed(1)),
        totalRatings: allReviews.length,
        successRate: parseFloat(successRate.toFixed(1)),
      },
      { new: true }
    );

    // Update case review
    await Case.findByIdAndUpdate(caseId, {
      lawyerRating: rating,
      lawyerReview: comment,
    });

    res.status(201).json({
      message: 'Review added successfully',
      review,
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Error adding review' });
  }
});

// Get reviews for lawyer
router.get('/lawyer/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const reviews = await Review.find({ lawyerId })
      .populate('clientId', 'name')
      .populate('caseId', 'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Get reviews for case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const review = await Review.findOne({ caseId })
      .populate('lawyerId', 'name')
      .populate('clientId', 'name');

    res.json(review || {});
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Error fetching review' });
  }
});

// Get lawyer stats (for profile)
router.get('/stats/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const reviews = await Review.find({ lawyerId });
    const lawyer = await Lawyer.findById(lawyerId);

    const stats = {
      totalReviews: reviews.length,
      averageRating: lawyer.rating || 0,
      successRate: lawyer.successRate || 0,
      casesWon: lawyer.casesWon || 0,
      casesTotal: lawyer.casesTotal || 0,
      experience: lawyer.experience || 0,
      winRate: lawyer.winRate || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    res.json(review);
  } catch (error) {
    console.error('Error updating helpful count:', error);
    res.status(500).json({ error: 'Error updating helpful count' });
  }
});

module.exports = router;
