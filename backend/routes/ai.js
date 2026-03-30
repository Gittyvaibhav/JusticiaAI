const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { analyzeCaseWithGemini } = require('../utils/aiAnalysis');

const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { description, caseType, location, urgency } = req.body;

    if (!description || !caseType || !location || !urgency) {
      return res.status(400).json({ message: 'Description, case type, location, and urgency are required' });
    }

    const advice = await analyzeCaseWithGemini({
      description,
      caseType,
      location,
      urgency,
    });

    return res.status(200).json({
      advice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
});

module.exports = router;
