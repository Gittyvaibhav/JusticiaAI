const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Case = require('../models/Case');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const { upload, isCloudinaryConfigured } = require('../config/cloudinary');
const { analyzeCaseWithGemini } = require('../utils/aiAnalysis');
const { sendEmail, isEmailConfigured } = require('../utils/mailer');

const router = express.Router();

function requireRole(expectedRole, req, res) {
  if (req.user.role !== expectedRole) {
    res.status(403).json({ message: `Only ${expectedRole}s can perform this action` });
    return false;
  }

  return true;
}

function mapUploadedDocuments(files) {
  if (!Array.isArray(files)) {
    return [];
  }

  return files
    .map((file) => file.path || file.secure_url || (file.originalname ? `uploaded:${file.originalname}` : null))
    .filter(Boolean);
}

function urgencyPriority(urgency) {
  return { high: 0, medium: 1, low: 2 }[urgency] ?? 3;
}

router.post('/submit', authMiddleware, upload.array('documents', 5), async (req, res) => {
  try {
    if (!requireRole('user', req, res)) {
      return;
    }

    const { title, description, caseType, location, urgency } = req.body;

    if (!title || !description || !caseType || !location || !urgency) {
      return res.status(400).json({ message: 'Title, description, case type, location, and urgency are required' });
    }

    if (description.trim().length < 100) {
      return res.status(400).json({ message: 'Description must be at least 100 characters long' });
    }

    const advice = await analyzeCaseWithGemini({ description, caseType, location, urgency });
    const documents = mapUploadedDocuments(req.files);

    if (req.files?.length && !isCloudinaryConfigured && documents.length === 0) {
      return res.status(500).json({ message: 'Document upload is not configured on the server' });
    }

    const createdCase = await Case.create({
      userId: req.user.id,
      title,
      description,
      caseType,
      location,
      urgency,
      documents,
      aiAdvice: advice.fullResponse,
      aiCaseSummary: advice.caseSummary,
      aiRelevantLaws: advice.relevantLaws,
      aiNextSteps: advice.nextSteps,
      aiCaseStrength: advice.caseStrength,
      aiLawyerTypeNeeded: advice.lawyerTypeNeeded,
    });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { cases: createdCase._id },
    });

    return res.status(201).json({
      case: createdCase,
      advice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit case', error: error.message });
  }
});

router.get('/my-cases', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('user', req, res)) {
      return;
    }

    const cases = await Case.find({ userId: req.user.id })
      .populate('assignedLawyer', 'name phone email rating totalRatings casesWon casesTotal specializations location')
      .sort({ createdAt: -1 });

    return res.status(200).json({ cases });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch cases' });
  }
});

router.get('/available', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('lawyer', req, res)) {
      return;
    }

    const cases = await Case.find({ status: 'open' })
      .populate('userId', 'name location')
      .lean();

    cases.sort((a, b) => urgencyPriority(a.urgency) - urgencyPriority(b.urgency) || new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ cases });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch available cases' });
  }
});

router.get('/available/:specialization', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('lawyer', req, res)) {
      return;
    }

    const cases = await Case.find({
      status: 'open',
      caseType: req.params.specialization,
    })
      .populate('userId', 'name location')
      .lean();

    cases.sort((a, b) => urgencyPriority(a.urgency) - urgencyPriority(b.urgency) || new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ cases });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch available cases' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('userId', 'name phone location')
      .populate('assignedLawyer', 'name email phone location rating totalRatings barCouncilId specializations casesWon casesTotal');

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const isOwner = caseDoc.userId?._id.toString() === req.user.id;
    const isAssignedLawyer = caseDoc.assignedLawyer?._id.toString() === req.user.id;

    if (!isOwner && !isAssignedLawyer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({ case: caseDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch case' });
  }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('lawyer', req, res)) {
      return;
    }

    const [caseDoc, lawyer] = await Promise.all([
      Case.findById(req.params.id).populate('userId', 'name email'),
      Lawyer.findById(req.user.id),
    ]);

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    if (caseDoc.status !== 'open') {
      return res.status(400).json({ message: 'Case is no longer available' });
    }

    caseDoc.assignedLawyer = lawyer._id;
    caseDoc.status = 'assigned';
    await caseDoc.save();

    lawyer.activeCases = [...new Set([...lawyer.activeCases.map(String), String(caseDoc._id)])];
    lawyer.casesTotal += 1;
    await lawyer.save();

    if (isEmailConfigured) {
      await sendEmail({
        to: caseDoc.userId?.email,
        subject: 'Your AI Lawyer case has been accepted',
        text: `${lawyer.name} has accepted your case "${caseDoc.title}". You can now view the assigned lawyer details in your dashboard.`,
      }).catch((error) => console.error('Email send failed:', error.message));
    }

    return res.status(200).json({
      case: await caseDoc.populate('assignedLawyer', 'name email phone location rating totalRatings specializations'),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to accept case' });
  }
});

router.post('/:id/update-status', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('lawyer', req, res)) {
      return;
    }

    const { status, outcome } = req.body;

    if (!['in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either in-progress or resolved' });
    }

    const caseDoc = await Case.findById(req.params.id).populate('userId', 'email name');

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!caseDoc.assignedLawyer || caseDoc.assignedLawyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned lawyer can update this case' });
    }

    if (status === 'resolved' && !['won', 'lost', 'settled'].includes(outcome)) {
      return res.status(400).json({ message: 'Resolved cases require a valid outcome' });
    }

    const lawyer = await Lawyer.findById(req.user.id);

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    caseDoc.status = status;

    if (status === 'resolved') {
      caseDoc.outcome = outcome;
      lawyer.activeCases = lawyer.activeCases.filter((caseId) => caseId.toString() !== caseDoc._id.toString());

      if (outcome === 'won') {
        lawyer.casesWon += 1;
      } else if (outcome === 'lost') {
        lawyer.casesLost += 1;
      }
    }

    await Promise.all([caseDoc.save(), lawyer.save()]);

    if (status === 'resolved' && isEmailConfigured) {
      await sendEmail({
        to: caseDoc.userId?.email,
        subject: 'Your AI Lawyer case status was updated',
        text: `Your case "${caseDoc.title}" was marked as resolved with outcome: ${caseDoc.outcome}. Please review the case in your dashboard.`,
      }).catch((error) => console.error('Email send failed:', error.message));
    }

    return res.status(200).json({
      case: await caseDoc.populate('assignedLawyer', 'name email phone location rating totalRatings specializations'),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update case status' });
  }
});

router.post('/:id/rate-lawyer', authMiddleware, async (req, res) => {
  try {
    if (!requireRole('user', req, res)) {
      return;
    }

    const { rating, review } = req.body;
    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const caseDoc = await Case.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the case owner can rate the lawyer' });
    }

    if (!caseDoc.assignedLawyer || caseDoc.status !== 'resolved') {
      return res.status(400).json({ message: 'This case is not ready for lawyer rating' });
    }

    if (caseDoc.lawyerRating) {
      return res.status(400).json({ message: 'Lawyer has already been rated for this case' });
    }

    caseDoc.lawyerRating = numericRating;
    caseDoc.lawyerReview = review;
    await caseDoc.save();

    const lawyer = await Lawyer.findById(caseDoc.assignedLawyer);
    const currentAggregate = lawyer.rating * lawyer.totalRatings;
    lawyer.totalRatings += 1;
    lawyer.rating = (currentAggregate + numericRating) / lawyer.totalRatings;
    await lawyer.save();

    return res.status(200).json({
      case: await Case.findById(caseDoc._id).populate('assignedLawyer', 'name email phone location rating totalRatings specializations'),
      lawyerRating: lawyer.rating,
      totalRatings: lawyer.totalRatings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to rate lawyer' });
  }
});

module.exports = router;
